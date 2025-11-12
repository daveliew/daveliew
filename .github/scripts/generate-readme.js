#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load professional summary JSON
const summaryPath = path.join(__dirname, '../../data/professional-summary.json');
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

// Generate README content
const readmeContent = `# ${summary.hero.title}

> ${summary.hero.hook}

${summary.hero.subtitle}

**${summary.hero.validation}**

---

## 🎯 Core Frameworks

### ${summary.frameworks.contextEngineering.name}
${summary.frameworks.contextEngineering.tagline}

${summary.frameworks.contextEngineering.description}

### ${summary.frameworks.threeHat.name}
**Systems Architect:** ${summary.frameworks.threeHat.hats.systemsArchitect}
**Product Manager:** ${summary.frameworks.threeHat.hats.productManager}
**Implementation:** ${summary.frameworks.threeHat.hats.implementation}

*${summary.frameworks.threeHat.contexts}*

---

## 🚀 Current Work

### Client Projects
${summary.featuredProjects.map(project => {
  const link = project.url ? `[${project.name}](${project.url})` : project.name;
  return `- **${link}** - ${project.description}\n  - *${project.outcome}*`;
}).join('\n')}

### Foundation Projects
${summary.foundationProjects.map(project =>
  `- **[${project.name}](${project.url})** - ${project.description}`
).join('\n')}

---

## 📊 Proven Results

${summary.metrics.map(metric =>
  `- **${metric.label}:** ${metric.value}`
).join('\n')}

---

## 💡 Implementation Stack

\`\`\`javascript
const currentStack = {
  ai: ${JSON.stringify(summary.techStack.ai)},
  development: ${JSON.stringify(summary.techStack.development)},
  web: ${JSON.stringify(summary.techStack.web)},
  backend: ${JSON.stringify(summary.techStack.backend)},
  automation: ${JSON.stringify(summary.techStack.automation)},
  deployment: ${JSON.stringify(summary.techStack.deployment)}
}

const philosophy = "${summary.philosophy}"
\`\`\`

---

## 🎓 Background

**Professional Achievements:**
- 4 ventures co-founded
- S$1M+ revenue growth contributed across ventures
- Michelin recognition (Labyrinth Restaurant)
- 35% revenue growth at Nansen (web3 analytics)

**Experience:**
- Meta - Technical Solutions Consultant (AdTech implementation)
- Nansen - Alpha Growth Ops (Blockchain data analytics)
- SG Code Campus - Head of Business (EdTech)
- General Assembly - Software Engineering Immersive

---

## 💬 Let's Connect

**${summary.cta.availability}**

${summary.cta.services.map(service => `- ${service}`).join('\n')}

📧 [Contact](${summary.cta.contactUrl}) | 🌐 [Portfolio](${summary.cta.portfolioUrl}) | 💼 [LinkedIn](${summary.cta.linkedinUrl})

---

*This README is automatically synced from [professional-summary.json](./data/professional-summary.json). Last updated: ${new Date().toISOString().split('T')[0]}*
`;

// Write README
const readmePath = path.join(__dirname, '../../README.md');
fs.writeFileSync(readmePath, readmeContent, 'utf8');

console.log('✅ README.md generated successfully from professional-summary.json');
