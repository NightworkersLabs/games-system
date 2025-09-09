import chalk from "chalk";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class EnvGenerator<T extends { [key: string]: any }> {
  /** ouputs resumé of env data into log */
  public build(builded: T, fieldsToRedact?: string[]): T {
    //
    if (process.env.NODE_ENV == null) {
      console.log(
        chalk.red(
          "Careful, process.env.NODE_ENV is not defined ! If you are in a production environment, please make sure it is set !",
        ),
      );
    }

    //
    const redacted = Object.assign({}, builded);
    this._redactField(redacted, "MNEMO_OR_PRIV_KEY");

    //
    if (fieldsToRedact) {
      fieldsToRedact.forEach((ftr) => this._redactField(redacted, ftr));
    }

    console.log("=== USED ENV VARIABLES ===>", redacted);

    //
    return builded;
  }

  //
  private _redactField(obj: T, fieldName: string) {
    const val = obj[fieldName];
    if (val == null) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj as any)[fieldName] = `===[REDACTED]=== (length: ${val.length})`;
  }
}
