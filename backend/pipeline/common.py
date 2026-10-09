"""Small helpers shared by the pipeline steps: names, ids and the generated files' location."""

import re
import unicodedata
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "app" / "data"
GENERATED_DIR = DATA_DIR / "generated"

USER_AGENT = "CivicLens data pipeline (+https://github.com/whatalshifa/civiclens)"

# Official sources don't always agree on a state's name. CivicLens uses these.
STATE_NAMES = {
    "NCT of Delhi": "Delhi",
    "National Capital Territory of Delhi": "Delhi",
    "Orissa": "Odisha",
    "Pondicherry": "Puducherry",
    "Chattisgarh": "Chhattisgarh",
    "Uttaranchal": "Uttarakhand",
    "Andaman & Nicobar": "Andaman and Nicobar Islands",
    "Andaman & Nicobar Islands": "Andaman and Nicobar Islands",
    "Jammu & Kashmir": "Jammu and Kashmir",
    "Dadra & Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
    "Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu",
    "The Dadra and Nagar Haveli and Daman and Diu": "Dadra and Nagar Haveli and Daman and Diu",
}


def state_name(name: str) -> str:
    name = " ".join(name.split())
    return STATE_NAMES.get(name, name)


def slug(text: str) -> str:
    """'Rae Bareli' -> 'rae-bareli'. Accents and punctuation are dropped."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def key(text: str) -> str:
    """A loose form for comparing names: 'Janjgir-Champa' and 'Janjgir Champa' match."""
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", text).lower())


def same_person(a: str, b: str) -> bool:
    """True when two spellings of a name plainly mean the same person.

    'Dr. C. N. Manjunath' and 'C N Manjunath' match; so do 'Ravi Kishan (Ravindra Shukla)' and
    'Ravindra Shukla Alias Ravi Kishan'. 'Kangana Ranaut' and 'Kangna Ranaut' do not: a spelling
    difference is reported for a person to look at, never decided by the pipeline.
    """
    honorifics = {"dr", "shri", "smt", "sh", "kumari", "km", "prof", "adv", "alias", "sk"}

    def words(name: str) -> set[str]:
        return {w for w in re.findall(r"[a-z]+", name.lower()) if w not in honorifics and len(w) > 1}

    wa, wb = words(a), words(b)
    return bool(wa) and bool(wb) and (wa <= wb or wb <= wa)
