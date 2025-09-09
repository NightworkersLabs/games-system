//
// @dev schemas must be in the same file to prevent null-coalescing of exported schemas definitions when using "..." (eg. "...ICheapeable.properties")
//

//
export const ICheapeable = {
  properties: {
    /**
     * @dev
     * - 'null' or 'undefined' means ONLY mainnets
     * - 'true' means ONLY testnets
     * - 'false' means ONLY testnets + mainnets
     */
    onlyCheap: { type: "boolean" },
  },
} as const;

//
export const ITypedByGame = {
  properties: {
    game: { type: "string" },
  },
} as const;

/** @dev do not move this declaration from ICheapeable */
export const typedByGame = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...ITypedByGame.properties,
    ...ICheapeable.properties,
  },
} as const;

//
export const cheapable = {
  type: "object",
  additionalProperties: false,
  ...ICheapeable,
} as const;

/** @dev do not move this declaration from ICheapeable */
export const Imandatory = {
  properties: {
    trackerId: { type: "number" },
    ...ICheapeable.properties,
  },
  required: ["trackerId"],
} as const;

/** @dev do not move this declaration from Imandatory */
export const mandatory = {
  type: "object",
  additionalProperties: false,
  ...Imandatory,
} as const;

//
export const paged = {
  type: "object",
  allOf: [
    Imandatory,
    {
      properties: {
        page: { type: "number" },
        length: { type: "number" },
      },
    },
  ],
} as const;

/** @dev do not move this declaration from ICheapeable */
export const withId = {
  type: "object",
  additionalProperties: false,
  properties: {
    historyId: { type: "string" },
    ...ITypedByGame.properties,
  },
} as const;
