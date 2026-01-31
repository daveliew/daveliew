#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, '../../data/professional-summary.json');
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

const badges = summary.badges
  .map(b => {
    if (b.logo) {
      return `![${b.label}](https://img.shields.io/badge/${encodeURIComponent(b.label)}-${b.color}?logo=${b.logo}&logoColor=${b.logoColor})`;
    }
    return `![${b.label}](https://img.shields.io/badge/${encodeURIComponent(b.label)}-${b.color})`;
  })
  .join(' ');

const focus = summary.currentFocus.map(item => `- ${item}`).join('\n');

const links = [
  `[![Website](https://img.shields.io/badge/${encodeURIComponent(summary.links.website.label)}-black?style=flat-square)](${summary.links.website.url})`,
  `[![LinkedIn](https://img.shields.io/badge/${summary.links.linkedin.label}-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](${summary.links.linkedin.url})`,
].join(' ');

const readmeContent = `# ${summary.name}

${summary.tagline}

${summary.oneLiner}

${badges}

---

### Currently exploring

${focus}

### Learning in public

${summary.pinned}

---

${links}
`;

const readmePath = path.join(__dirname, '../../README.md');
fs.writeFileSync(readmePath, readmeContent, 'utf8');

console.log('README.md generated from professional-summary.json');
