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
        if "srcset" in attrs:
            self.assets.extend(part.split()[0] for part in attrs["srcset"].split(","))


def resolve(base, link):
    """Root-relative links start at dist/, everything else at the referencing file."""
    path = link.split("?")[0].split("#")[0]
    return root / path.lstrip("/") if path.startswith("/") else base / path


def check_page(directory):
    page = Page()
    page.feed((directory / "index.html").read_text())
    name = "/" + directory.relative_to(root).as_posix().strip(".")
    assert len(page.ids) == len(set(page.ids)), f"{name}: duplicate HTML IDs"
    for link in page.links + page.assets:
        if link.startswith("#"):
            assert link == "#" or link[1:] in page.ids, f"{name}: missing anchor {link}"
        elif not re.match(r"[a-z]+:", link):
            assert resolve(directory, link).is_file(), f"{name}: missing asset {link}"
    css = (directory / "styles.css").read_text()
    for match in re.findall(r'''url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\)''', css):
        asset = next(part for part in match if part)
        if not asset.startswith("data:"):
            assert resolve(directory, asset).is_file(), f"{name}: missing CSS asset {asset}"
    js = (directory / "app.js").read_text()
    for selector in re.findall(r"querySelector\(['\"]#([^'\"]+)", js):
        assert selector in page.ids, f"{name}: unknown JavaScript target {selector}"
    for asset in re.findall(r"['\"]((?:/|assets/)[^'\"]+\.\w+)['\"]", js):
        assert resolve(directory, asset).is_file(), f"{name}: missing JavaScript asset {asset}"
    assert not re.search(r"https?://", js), f"{name}: unexpected external script service"
    return len(page.ids)


counts = {"/" + directory.relative_to(root).as_posix().strip("."): check_page(directory)
          for directory in (root, root / "draft-one")}
draft = (root / "draft-one" / "index.html").read_text()
assert '<meta name="robots" content="noindex">' in draft, "Archived draft should stay out of search results"

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

summary = ", ".join(f"{name} ({count} IDs)" for name, count in counts.items())
print(f"PASS: {summary}; local assets, navigation, JS targets, calendar dates and folding.")
