"""Settings of the centralize-data scripts. See README.md."""

# --- Grist ---------------------------------------------------------------

SERVER = "https://grist.numerique.gouv.fr"
TIMEOUT = 60  # seconds, for each Grist API call
PAUSE_SECONDS = 10  # pause between two documents, to avoid overloading the Grist server
TABLE_PAUSE_SECONDS = 2  # pause between two tables of the same document

# Grist table -> scrutin type
TABLES = {
    "Table_scrutins_CAP": "CAP",
    "Table_scrutins_CCP": "CCP",
    "Table_scrutins_CST": "CST",
}
# Grist row id of Referentiel_departements -> department number.
# Collectivite_organisatrice__Prefecture stores the row id (e.g. 96 for "95"). The table itself is not read:
# the ids are the same in every document (they are all copies of the same document).
# Update this mapping if Referentiel_departements changes.
DEPARTMENTS = {
    1: "01",  # Ain
    2: "02",  # Aisne
    3: "03",  # Allier
    4: "04",  # Alpes-de-Haute-Provence
    5: "05",  # Hautes-Alpes
    6: "06",  # Alpes-Maritimes
    7: "07",  # Ardèche
    8: "08",  # Ardennes
    9: "09",  # Ariège
    10: "10",  # Aube
    11: "11",  # Aude
    12: "12",  # Aveyron
    13: "13",  # Bouches-du-Rhône
    14: "14",  # Calvados
    15: "15",  # Cantal
    16: "16",  # Charente
    17: "17",  # Charente-Maritime
    18: "18",  # Cher
    19: "19",  # Corrèze
    20: "2A",  # Corse-du-Sud
    21: "2B",  # Haute-Corse
    22: "21",  # Côte-d’Or
    23: "22",  # Côtes-d’Armor
    24: "23",  # Creuse
    25: "24",  # Dordogne
    26: "25",  # Doubs
    27: "26",  # Drôme
    28: "27",  # Eure
    29: "28",  # Eure-et-Loir
    30: "29",  # Finistère
    31: "30",  # Gard
    32: "31",  # Haute-Garonne
    33: "32",  # Gers
    34: "33",  # Gironde
    35: "34",  # Hérault
    36: "35",  # Ille-et-Vilaine
    37: "36",  # Indre
    38: "37",  # Indre-et-Loire
    39: "38",  # Isère
    40: "39",  # Jura
    41: "40",  # Landes
    42: "41",  # Loir-et-Cher
    43: "42",  # Loire
    44: "43",  # Haute-Loire
    45: "44",  # Loire-Atlantique
    46: "45",  # Loiret
    47: "46",  # Lot
    48: "47",  # Lot-et-Garonne
    49: "48",  # Lozère
    50: "49",  # Maine-et-Loire
    51: "50",  # Manche
    52: "51",  # Marne
    53: "52",  # Haute-Marne
    54: "53",  # Mayenne
    55: "54",  # Meurthe-et-Moselle
    56: "55",  # Meuse
    57: "56",  # Morbihan
    58: "57",  # Moselle
    59: "58",  # Nièvre
    60: "59",  # Nord
    61: "60",  # Oise
    62: "61",  # Orne
    63: "62",  # Pas-de-Calais
    64: "63",  # Puy-de-Dôme
    65: "64",  # Pyrénées-Atlantiques
    66: "65",  # Hautes-Pyrénées
    67: "66",  # Pyrénées-Orientales
    68: "67",  # Bas-Rhin
    69: "68",  # Haut-Rhin
    70: "69",  # Rhône
    71: "70",  # Haute-Saône
    72: "71",  # Saône-et-Loire
    73: "72",  # Sarthe
    74: "73",  # Savoie
    75: "74",  # Haute-Savoie
    76: "75",  # Paris
    77: "76",  # Seine-Maritime
    78: "77",  # Seine-et-Marne
    79: "78",  # Yvelines
    80: "79",  # Deux-Sèvres
    81: "80",  # Somme
    82: "81",  # Tarn
    83: "82",  # Tarn-et-Garonne
    84: "83",  # Var
    85: "84",  # Vaucluse
    86: "85",  # Vendée
    87: "86",  # Vienne
    88: "87",  # Haute-Vienne
    89: "88",  # Vosges
    90: "89",  # Yonne
    91: "90",  # Territoire de Belfort
    92: "91",  # Essonne
    93: "92",  # Hauts-de-Seine
    94: "93",  # Seine-Saint-Denis
    95: "94",  # Val-de-Marne
    96: "95",  # Val-d’Oise
    97: "971",  # Guadeloupe
    98: "972",  # Martinique
    99: "973",  # Guyane
    100: "974",  # La Réunion
    101: "976",  # Mayotte
    102: "975",  # Saint-Pierre-et-Miquelon
    103: "977-978",  # Saint-Barthélemy/Saint-Martin
    105: "987",  # Polynésie française
    106: "989",  # Île de Clipperton
    107: "986",  # Wallis et Futuna
    108: "988",  # Nouvelle-Calédonie
    109: "984",  # Terres australes et antarctiques françaises
    110: "99",  # Etranger
}


# Grist columns used by the sync (the other columns are copied if the PostgreSQL table has them)
DEFAULT_UUID_COLUMN = "UUID"  # identifies the row, stored in the `uuid` column
COL_DEPARTMENT = "Collectivite_organisatrice__Prefecture"  # Ref:Referentiel_departements, used to filter the rows

# Grist DateTime columns, stored as text in PostgreSQL (e.g. "2024-11-19 07:06:40", UTC).
# Grist gives them as a number of seconds: without this list, the number itself would be stored.
DATETIME_COLUMNS = ["Horodatage_modification"]


# --- PostgreSQL ----------------------------------------------------------

# One PostgreSQL table per scrutin type: resultats_cap, resultats_ccp, resultats_cst
DB_TABLE_PREFIX = "resultats_"

# Table with one entry per synced table of each document (status, error…)
SYNC_LOG_TABLE = "sync_log"


# --- Documents file --------------------------------------------------------


def get_doc_txt_config(path):
    """Read the documents file: one `docId,department` line per document (e.g. `abc123,95`).

    Return {doc_id: department}. Raise ValueError on a line without exactly one department,
    or a doc id or a department given twice (the department identifies the rows of the document in PostgreSQL).
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
            if department in docs.values():
                raise ValueError(f"{path}:{line_number}: department {department} is given twice")
            docs[doc_id] = department
    return docs


def get_departement_id(number):
    """Return the Grist row id of a department number in Referentiel_departements, e.g. 96 for "95".

    It is the value stored in Collectivite_organisatrice__Prefecture, used to filter the rows.
    Raise ValueError if the department is not in DEPARTMENTS.
    """
    for row_id, department in DEPARTMENTS.items():
        if department == number:
            return row_id
    raise ValueError(f"department {number} not found in DEPARTMENTS (config.py)")
