# aigroup-paper-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-0.3.6-brightgreen.svg)](https://github.com/jackdark425/aigroup-paper-mcp)

> Academic paper search and retrieval MCP server integrating multiple scholarly platforms into a unified interface.

## Overview

`aigroup-paper-mcp` provides a unified MCP interface for searching, retrieving, and organizing academic paper metadata across major scholarly sources.

It is designed for:

- cross-platform academic paper search
- paper metadata retrieval and browsing
- literature review assistance
- research gap analysis and comparison workflows
- integration with Claude Desktop and other MCP-compatible clients

## Highlights

- **12+ academic platforms** integrated behind one MCP interface
- **6 advanced tools** for search, fetch, discovery, and trend analysis
- **3 resource patterns** for direct metadata and category access
- **3 prompt templates** for literature-review-style workflows
- **structured responses, caching, and parallel search support**

## Supported Sources

The server currently supports sources such as:

- arXiv
- OpenAlex
- PubMed Central (PMC)
- Europe PMC
- bioRxiv
- medRxiv
- CORE
- Semantic Scholar
- Crossref
- PubMed
- Google Scholar
- IACR

## Quick Start

### Requirements

- Node.js >= 18
- npm

### Install and build locally

```bash
git clone https://github.com/jackdark425/aigroup-paper-mcp.git
cd aigroup-paper-mcp
npm install
npm run build
npm start
```

### Run as CLI with npx

```bash
npx aigroup-paper-mcp --help
npx aigroup-paper-mcp search "machine learning"
npx aigroup-paper-mcp fetch "2301.00001" --source arxiv
```

## MCP Client Configuration

### Claude Desktop / RooCode / compatible MCP clients

```json
{
  "mcpServers": {
    "aigroup-paper-mcp": {
      "command": "npx",
      "args": ["aigroup-paper-mcp"]
    }
  }
}
```

## Tools

### `search_papers`
Cross-platform paper search with smart source selection and query optimization.

### `fetch_paper`
Fetches detailed metadata for a paper by source and identifier.

### `fetch_latest`
Gets the latest papers from a selected source/category.

### `list_categories`
Lists supported categories for a given platform.

### `advanced_search`
Supports more complex boolean-style academic search queries.

### `trend_analysis`
Analyzes topic evolution and publication trends over time.

## Resources

- `paper://{source}/{id}`
- `category://{source}/{category}`
- `search://{query}`

## Prompt Templates

- `literature_review`
- `research_gap_analysis`
- `paper_comparison`

## Environment Variables

Create a `.env` file if needed:

```env
LOG_LEVEL=info
CACHE_ENABLED=true
CACHE_TTL=3600
MAX_SEARCH_LIMIT=100
```

## Project Structure

```text
aigroup-paper-mcp/
├── src/
├── docs/
├── scripts/
├── package.json
└── README.md
```

## Development

```bash
npm run build
npm run test
npm run lint
```

## License & Usage

This project is released under the **MIT License**.

You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies of this software, including in academic, internal, and commercial contexts, provided that the original copyright notice and license text are preserved.

Please keep in mind:

- the software is provided **"AS IS"**, without warranty of any kind
- you must retain the relevant copyright and permission notice in copies or substantial portions of the software
- downstream usage remains subject to the terms, rate limits, metadata rules, and access restrictions of upstream academic data providers

See the full text in [LICENSE](LICENSE).

## Acknowledgments

### Scholarly Data Ecosystem

Thanks to the academic and open metadata ecosystems that make federated retrieval possible, including arXiv, OpenAlex, PubMed, Crossref, Semantic Scholar, and related services.

### MCP Ecosystem

- **Model Context Protocol SDK**
  - Repository: https://github.com/modelcontextprotocol/servers
  - Role: MCP server integration and tool/resource/prompt model

## Support

- Issues: https://github.com/jackdark425/aigroup-paper-mcp/issues
- Repository: https://github.com/jackdark425/aigroup-paper-mcp
- Docs: https://github.com/jackdark425/aigroup-paper-mcp/tree/main/docs
