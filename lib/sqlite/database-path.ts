export function getDatabaseFileName(databaseFilePath: string) {
  return databaseFilePath.replace(/\\/g, "/").split("/").at(-1) ?? "";
}

export function isSameDatabaseFileName(
  firstDatabaseFilePath: string,
  secondDatabaseFilePath: string,
) {
  return (
    getDatabaseFileName(firstDatabaseFilePath) ===
    getDatabaseFileName(secondDatabaseFilePath)
  );
}
