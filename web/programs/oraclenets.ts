/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/oraclenets.json`.
 */
export type Oraclenets = {
  "address": "7LmvhrFDYvjKv5zH2X4dWiXFv9kr8A4Lej7Xo8EasyCk",
  "metadata": {
    "name": "oraclenets",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claim",
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "claimant",
          "writable": true,
          "signer": true
        },
        {
          "name": "claimantTokenAccount",
          "writable": true
        },
        {
          "name": "oracle",
          "writable": true
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oracle"
              }
            ]
          }
        },
        {
          "name": "commitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  105,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oracle"
              },
              {
                "kind": "account",
                "path": "claimant"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "commit",
      "discriminator": [
        223,
        140,
        142,
        165,
        229,
        208,
        156,
        74
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "payerTokenAccount",
          "writable": true
        },
        {
          "name": "oracle",
          "writable": true
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oracle"
              }
            ]
          }
        },
        {
          "name": "commitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  105,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oracle"
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "commitArgs"
            }
          }
        }
      ]
    },
    {
      "name": "finalize",
      "discriminator": [
        171,
        61,
        218,
        56,
        127,
        115,
        12,
        217
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "owner",
          "relations": [
            "oracle"
          ]
        },
        {
          "name": "oracle",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "oracle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  97,
                  99,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              },
              {
                "kind": "arg",
                "path": "args.question_uuid"
              }
            ]
          }
        },
        {
          "name": "collateralMint"
        },
        {
          "name": "collateralVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  108,
                  108,
                  97,
                  116,
                  101,
                  114,
                  97,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oracle"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "initializeArgs"
            }
          }
        }
      ]
    },
    {
      "name": "reveal",
      "discriminator": [
        9,
        35,
        59,
        190,
        167,
        249,
        76,
        115
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "oracle",
          "writable": true
        },
        {
          "name": "commitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  105,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oracle"
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "revealArgs"
            }
          }
        }
      ]
    },
    {
      "name": "revealize",
      "discriminator": [
        188,
        143,
        99,
        231,
        248,
        16,
        136,
        208
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "owner",
          "relations": [
            "oracle"
          ]
        },
        {
          "name": "oracle",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "slash",
      "discriminator": [
        204,
        141,
        18,
        161,
        8,
        177,
        92,
        142
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "oracle",
          "writable": true
        },
        {
          "name": "target"
        },
        {
          "name": "commitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  105,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "oracle"
              },
              {
                "kind": "account",
                "path": "target"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "slashArgs"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "commitment",
      "discriminator": [
        61,
        112,
        129,
        128,
        24,
        147,
        77,
        87
      ]
    },
    {
      "name": "oracle",
      "discriminator": [
        139,
        194,
        131,
        179,
        140,
        179,
        229,
        244
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidCollateralAmount",
      "msg": "Invalid collateral amount."
    },
    {
      "code": 6001,
      "name": "mathOverflow",
      "msg": "Math overflow."
    },
    {
      "code": 6002,
      "name": "wrongStage",
      "msg": "Wrong stage."
    },
    {
      "code": 6003,
      "name": "commitmentAlreadyRevealed",
      "msg": "Commitment already revealed."
    },
    {
      "code": 6004,
      "name": "invalidHash",
      "msg": "Invalid hash."
    },
    {
      "code": 6005,
      "name": "alreadyClaimed",
      "msg": "Already claimed."
    },
    {
      "code": 6006,
      "name": "commitmentSlashed",
      "msg": "Commitment slashed."
    },
    {
      "code": 6007,
      "name": "commitmentNotRevealed",
      "msg": "Commitment not revealed."
    },
    {
      "code": 6008,
      "name": "invalidResolution",
      "msg": "Invalid resolution."
    },
    {
      "code": 6009,
      "name": "oracleNotResolved",
      "msg": "Oracle not resolved."
    },
    {
      "code": 6010,
      "name": "questionTooLong",
      "msg": "Question too long."
    },
    {
      "code": 6011,
      "name": "unauthorized",
      "msg": "Unauthorized."
    },
    {
      "code": 6012,
      "name": "invalidUuid",
      "msg": "Invalid UUID."
    }
  ],
  "types": [
    {
      "name": "commitArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "commitHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "commitment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payerTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "commitHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "isRevealed",
            "type": "bool"
          },
          {
            "name": "resolutionBit",
            "type": "bool"
          },
          {
            "name": "isSlashed",
            "type": "bool"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "initializeArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "questionUuid",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "question",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "oracle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "uuid",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "collateralMint",
            "type": "pubkey"
          },
          {
            "name": "collateralVault",
            "type": "pubkey"
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "stage",
            "type": {
              "defined": {
                "name": "stage"
              }
            }
          },
          {
            "name": "countJoined",
            "type": "u64"
          },
          {
            "name": "countResolutionTrue",
            "type": "u64"
          },
          {
            "name": "countResolutionFalse",
            "type": "u64"
          },
          {
            "name": "countSlashed",
            "type": "u64"
          },
          {
            "name": "isResolved",
            "type": "bool"
          },
          {
            "name": "isTie",
            "type": "bool"
          },
          {
            "name": "resolutionBit",
            "type": "bool"
          },
          {
            "name": "amountWinners",
            "type": "u64"
          },
          {
            "name": "question",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "revealArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "commitNonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "slashArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "commitNonce",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stage",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "commit"
          },
          {
            "name": "reveal"
          },
          {
            "name": "claim"
          }
        ]
      }
    }
  ]
};
