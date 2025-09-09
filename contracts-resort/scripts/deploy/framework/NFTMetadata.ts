import { base64 } from "ethers/lib/utils";
import { mkdirSync, writeFileSync } from "fs";

export interface NFTTraitMetadata {
  trait_type: string;
  value: string;
}

export class NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTTraitMetadata[];

  //
  constructor(tokenURIOutput: string) {
    //
    const obj = JSON.parse(NFTMetadata._parseTokenURI(tokenURIOutput));

    //
    this.name = obj.name;
    this.description = obj.description;
    this.image = obj.image;
    this.attributes = obj.attributes;
  }

  //
  // PUBLIC
  //

  outputAsSVG() {
    this._prepareOutput();
    this._writeToOutputDir("minted.svg", this.getSVG());
  }

  outputAsJSON() {
    this._prepareOutput();
    this._writeToOutputDir("minted.json", JSON.stringify(this));
  }

  getSVG(): string {
    return NFTMetadata._parseTokenURI(this.image);
  }

  //
  // PRIVATE
  //

  private static _parseTokenURI(tokenURIOutput: string): string {
    tokenURIOutput = tokenURIOutput.substring(tokenURIOutput.indexOf(",") + 1);
    return new TextDecoder().decode(base64.decode(tokenURIOutput));
  }

  private _prepareOutput() {
    // create folder
    mkdirSync("./output", { recursive: true });
  }

  private _writeToOutputDir(filename: string, content: string) {
    writeFileSync(`./output/${filename}`, content);
  }
}
