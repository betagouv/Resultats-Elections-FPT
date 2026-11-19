"""Settings of verify_data_before_centralize.py. See README.md."""

SERVER = "https://grist.numerique.gouv.fr"
TIMEOUT = 60  # seconds, for each Grist API call

# Grist table
TABLES = {
    "Table_scrutins_CAP": "CAP",
    "Table_scrutins_CCP": "CCP",
    "Table_scrutins_CST": "CST",
}

# Columns that must exist in each scrutins table (read by the sync)
DEFAULT_UUID_COLUMN = "UUID"
COL_DEPARTMENT = "Collectivite_organisatrice__Prefecture"  # Ref:Referentiel_departements
COL_STATUS = "Statut_saisie_des_resultats"
COL_HAS_PV = "Le_PV_du_scrutin_est_importe"  # Bool
COL_VALIDATE_PREF = "Validation_prefecture"  # Bool
COL_VALIDATE_DGCL = "Validation_DGCL"  # Bool
