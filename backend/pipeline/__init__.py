"""The data pipeline: fetches official records, checks them, and writes CivicLens's data files.

It runs on GitHub Actions every week (.github/workflows/refresh-data.yml). It never changes the
live site directly: what it writes goes into a pull request, which a person reviews and merges.
Run it yourself with `python -m pipeline --help` from the backend folder.
"""
