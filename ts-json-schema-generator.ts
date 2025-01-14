import * as commander from "commander";
import { writeFile } from "fs";
import * as stringify from "json-stable-stringify";
import { createGenerator } from "./factory/generator";
import { Config, DEFAULT_CONFIG } from "./src/Config";
import { BaseError } from "./src/Error/BaseError";
import { formatError } from "./src/Utils/formatError";

const args = commander
    .option("-p, --path <path>", "Source file path")
    .option("-t, --type <name>", "Type name")
    .option("-f, --tsconfig <path>", "Custom tsconfig.json path")
    .option("-e, --expose <expose>", "Type exposing", /^(all|none|export)$/, "export")
    .option("-r, --no-top-ref", "Do not create a top-level $ref definition")
    .option("-j, --jsDoc <extended>", "Read JsDoc annotations", /^(none|basic|extended)$/, "extended")
    .option("-u, --unstable", "Do not sort properties")
    .option("-s, --strict-tuples", "Do not allow additional items on tuples")
    .option("-c, --no-type-check", "Skip type checks to improve performance")
    .option("-o, --out <file>", "Set the output file (default: stdout)")
    .option(
        "-k, --validationKeywords [value]",
        "Provide additional validation keywords to include",
        (value: string, list: string[]) => list.concat(value),
        []
    )

    .parse(process.argv);

const config: Config = {
    ...DEFAULT_CONFIG,
    path: args.path,
    tsconfig: args.tsconfig,
    type: args.type,
    expose: args.expose,
    topRef: args.topRef,
    jsDoc: args.jsDoc,
    sortProps: !args.unstable,
    strictTuples: args.strictTuples,
    skipTypeCheck: !args.typeCheck,
    extraJsonTags: args.validationKeywords,
};

try {
    const schema = createGenerator(config).createSchema(args.type);
    const schemaString = config.sortProps ? stringify(schema, { space: 2 }) : JSON.stringify(schema, null, 2);

    if (args.out) {
        // write to file
        writeFile(args.out, schemaString, err => {
            if (err) throw err;
        });
    } else {
        // write to stdout
        process.stdout.write(schemaString);
    }
} catch (error) {
    if (error instanceof BaseError) {
        process.stderr.write(formatError(error));
        process.exit(1);
    } else {
        throw error;
    }
}
