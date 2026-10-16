"""Check the deployable static site without external dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from datetime import datetime
import re

root = Path(__file__).resolve().parents[1] / "dist"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.links = []
        self.assets = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if "href" in attrs:
            self.links.append(attrs["href"])
        for key in ("src", "poster"):
            if key in attrs:
                self.assets.append(attrs[key])


page = Page()
page.feed((root / "index.html").read_text())
assert len(page.ids) == len(set(page.ids)), "Duplicate HTML IDs"
for link in page.links + page.assets:
    if link.startswith("#"):
        assert link == "#" or link[1:] in page.ids, f"Missing anchor: {link}"
    elif not re.match(r"[a-z]+:", link):
        assert (root / link.split("?")[0]).is_file(), f"Missing asset: {link}"
css = (root / "styles.css").read_text()
for match in re.findall(r'''url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\)''', css):
    asset = next(part for part in match if part)
    if not asset.startswith("data:"):
        assert (root / asset).is_file(), f"Missing CSS asset: {asset}"

raw = (root / "supergroove-2027.ics").read_bytes()
assert b"\r\n" in raw and not re.search(rb"(?<!\r)\n", raw), "Calendar needs CRLF"
assert all(len(line) <= 75 for line in raw.split(b"\r\n")), "Unfolded long ICS line"
calendar = raw.decode().replace("\r\n ", "")
start = re.search(r"DTSTART;VALUE=DATE:(\d+)", calendar).group(1)
end = re.search(r"DTEND;VALUE=DATE:(\d+)", calendar).group(1)
start_date, end_date = (datetime.strptime(value, "%Y%m%d") for value in (start, end))
assert start == "20270403" and (end_date - start_date).days == 1
assert start_date.weekday() == 5, "Event should be a Saturday"
assert "TRANSP:TRANSPARENT" in calendar, "Save-the-date should not block the entire day"
assert "Location folgen" in calendar and "Uhrzeiten" in calendar

js = (root / "app.js").read_text()
for selector in re.findall(r"querySelector\(['\"]#([^'\"]+)", js):
    assert selector in page.ids, f"Unknown JavaScript target: {selector}"
assert not re.search(r"https?://", js), "Unexpected external script service"
print(f"PASS: {len(page.ids)} unique IDs, local assets, navigation, JS targets, calendar dates and folding.")
