"""Shared settings of the centralize-data scripts. See README.md."""

import csv
import os

# --- Grist ---------------------------------------------------------------

SERVER = "https://grist.numerique.gouv.fr"
TIMEOUT = 60  # seconds, for each Grist API call
PAUSE_SECONDS = 10  # pause between two documents, to avoid overloading the Grist server

# Grist table -> scrutin type
TABLES = {
    "Table_scrutins_CAP": "CAP",
    "Table_scrutins_CCP": "CCP",
    "Table_scrutins_CST": "CST",
}
# Grist row id of Referentiel_departements -> department (the table itself is not read)
DEPARTMENTS_CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "grist_departements.csv")
DEPARTMENTS_CSV_ID_COLUMN = "ID-grist"
DEPARTMENTS_CSV_NAME_COLUMN = "Nom complet"  # "01 – Ain": the number is the part before " – "

# Grist columns read in each scrutins table
DEFAULT_UUID_COLUMN = "UUID"
COL_DEPARTMENT = "Collectivite_organisatrice__Prefecture"  # Ref:Referentiel_departements
COL_STATUS = "Statut_saisie_des_resultats"
COL_HAS_PV = "Le_PV_du_scrutin_est_importe"  # Bool
COL_VALIDATE_PREF = "Validation_prefecture"  # Bool
COL_VALIDATE_DGCL = "Validation_DGCL"  # Bool

# --- SQLite --------------------------------------------------------------

DB_TABLE = "resultats_national"

# Columns stored for each row, besides the identifiers and the sync dates
VALUE_COLUMNS = ["type", "department", "status", "has_pv", "is_validate_pref", "is_validate_dgcl"]


# --- Documents file --------------------------------------------------------


def get_doc_txt_config(path):
    """Read the documents file: one `docId,department` line per document (e.g. `abc123,95`).

    Return {doc_id: department}. Raise ValueError on a line without exactly one department,
    or a doc id given twice.
    """
    docs = {}
    with open(path, encoding="utf-8") as f:
        for line_number, line in enumerate(f, start=1):
            if not line.strip():
                continue
            parts = [part.strip() for part in line.split(",")]
            if len(parts) != 2 or not all(parts) or "|" in parts[1]:
                raise ValueError(f"{path}:{line_number}: expected `docId,department` with one department, "
                                 f"got {line.strip()!r}")
            doc_id, department = parts
            if doc_id in docs:
                raise ValueError(f"{path}:{line_number}: doc id {doc_id} is given twice")
            docs[doc_id] = department
    return docs


def load_departments(path=DEPARTMENTS_CSV):
    """Read the departments CSV. Return {Grist row id: department number}, e.g. {1: "01", 20: "2A"}."""
    if not os.path.isfile(path):
        raise ValueError(f"Departments file not found: {path}")
    departments = {}
    with open(path, encoding="utf-8-sig", newline="") as f:
        for line_number, row in enumerate(csv.DictReader(f), start=2):
            try:
                row_id = int(row[DEPARTMENTS_CSV_ID_COLUMN])
                number = row[DEPARTMENTS_CSV_NAME_COLUMN].split(" – ")[0].strip()
            except (KeyError, ValueError, AttributeError):
                raise ValueError(f"{path}:{line_number}: expected `{DEPARTMENTS_CSV_NAME_COLUMN}` and "
                                 f"`{DEPARTMENTS_CSV_ID_COLUMN}` columns, got {row}")
            if not number or row_id in departments:
                raise ValueError(f"{path}:{line_number}: empty department or id {row_id} given twice")
            departments[row_id] = number
    return departments


def get_departement_id(departments, number):
    """Return the Grist row id of a department number in Referentiel_departements, e.g. 96 for "95".

    It is the value stored in Collectivite_organisatrice__Prefecture, used to filter the rows.
    `departments` is {row id: department number}, as read from the departments CSV.
    Raise ValueError if the department is unknown.
    """
    for row_id, department in departments.items():
        if department == number:
            return row_id
    raise ValueError(f"department {number} not found in {os.path.basename(DEPARTMENTS_CSV)}")


def check_docs_departments_exist(docs, departments):
    """Check that the department of every document ({doc_id: department}) is in the departments CSV.

    Called at startup, so an unknown department stops the script before any document is processed.
    Raise ValueError listing all the unknown departments.
    """
    known = set(departments.values())
    unknown = {doc_id: department for doc_id, department in docs.items() if department not in known}
    if unknown:
        details = ", ".join(f"{department} ({doc_id})" for doc_id, department in unknown.items())
        raise ValueError(f"department(s) not found in {os.path.basename(DEPARTMENTS_CSV)}: {details}")
