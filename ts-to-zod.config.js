module.exports = [
  {
    name: "caseStore",
    input: "src/lib/caseStore.ts",
    output: "src/generated/zod/caseStore.ts",
    skipValidation: true,
  },
  {
    name: "email",
    input: "src/lib/email.ts",
    output: "src/generated/zod/email.ts",
    skipValidation: true,
  },
  {
    name: "exif",
    input: "src/lib/exif.ts",
    output: "src/generated/zod/exif.ts",
    skipValidation: true,
  },
  {
    name: "geocode",
    input: "src/lib/geocode.ts",
    output: "src/generated/zod/geocode.ts",
    skipValidation: true,
  },
  {
    name: "ownershipModules",
    input: "src/lib/ownershipModules.ts",
    output: "src/generated/zod/ownershipModules.ts",
    skipValidation: true,
  },
  {
    name: "reportModules",
    input: "src/lib/reportModules.ts",
    output: "src/generated/zod/reportModules.ts",
    skipValidation: true,
  },
  {
    name: "vinSources",
    input: "src/lib/vinSources.ts",
    output: "src/generated/zod/vinSources.ts",
    skipValidation: true,
  },
];
