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

# Table listing the Grist documents to sync: doc_id, department, grist_department_id, enabled, cron_group
SYNC_DOCUMENTS_TABLE = "sync_documents"

# Table listing the cron groups: cron_group, enabled
SYNC_CRON_TABLE = "sync_cron"
