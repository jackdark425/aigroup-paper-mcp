import { ArxivDriver } from './arxiv/index.js';
import { OpenAlexDriver } from './openalex/index.js';
import { PmcDriver } from './pmc/index.js';
import { EuropePmcDriver } from './europepmc/index.js';
import { BiorxivDriver } from './biorxiv/index.js';
import { MedrxivDriver } from './medrxiv/index.js';
import { CoreDriver } from './core/index.js';
import { SemanticScholarDriver } from './semantic-scholar/index.js';
import { CrossrefDriver } from './crossref/index.js';
import { PubmedDriver } from './pubmed/index.js';
import { GoogleScholarDriver } from './google-scholar/index.js';
import { IacrDriver } from './iacr/index.js';
import { registerDriver } from './base/driver-factory.js';

// 注册所有驱动
export function initializeDrivers(): void {
  registerDriver(new ArxivDriver());
  registerDriver(new OpenAlexDriver());
  registerDriver(new PmcDriver());
  registerDriver(new EuropePmcDriver());
  registerDriver(new BiorxivDriver());
  registerDriver(new MedrxivDriver());
  registerDriver(new CoreDriver());
  registerDriver(new SemanticScholarDriver());
  registerDriver(new CrossrefDriver());
  registerDriver(new PubmedDriver());
  registerDriver(new GoogleScholarDriver());
  registerDriver(new IacrDriver());
}

export * from './base/index.js';
export * from './arxiv/index.js';
export * from './openalex/index.js';
export * from './pmc/index.js';
export * from './europepmc/index.js';
export * from './biorxiv/index.js';
export * from './medrxiv/index.js';
export * from './core/index.js';
export * from './semantic-scholar/index.js';
export * from './crossref/index.js';
export * from './pubmed/index.js';
export * from './google-scholar/index.js';
export * from './iacr/index.js';