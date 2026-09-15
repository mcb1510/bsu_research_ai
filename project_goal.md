# Project Goal

Build a prototype where BSU researchers open a website and:
- Chat with Muse Glimmer like any other LLM.
- Use agents.
- Use tools we provide.

The UI is LibreChat (this repo), customized. Muse Glimmer runs on Borah's L40S nodes via vLLM.

Out of scope for this prototype: persistent/forever uptime and general multi-user network access (Slurm scheduling, network exposure) — not the prototype owner's problem right now.

## Steps

1. Get plain chat working: point LibreChat at the Muse Glimmer vLLM endpoint as an ordinary custom endpoint. No agents, no tools yet — just confirm a normal conversation works end-to-end in the UI.
2. Turn on LibreChat's Agents feature for that endpoint, with zero tools attached. Confirm an agent can be created and run against Muse Glimmer.
3. Decide what tools researchers actually need, then wire those in (LibreChat's tool mechanism is MCP servers).
4. End-to-end test with a real research task.

Each step gets verified working before moving to the next.
