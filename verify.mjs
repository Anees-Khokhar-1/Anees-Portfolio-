import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "style.css",
  "content.js",
  "portfolio.js",
  "Anees_AI_Engineer_Resume.pdf",
  "favicon.svg",
  "site.webmanifest",
  "robots.txt",
  "vercel.json"
];

const errors = [];
const warnings = [];

const readText = file => fs.readFileSync(path.join(root, file), "utf8");
const normalize = value => String(value).trim().toLowerCase();
const duplicateValues = values => [...new Set(values.filter((value, index) =>
  values.findIndex(candidate => normalize(candidate) === normalize(value)) !== index
))];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    errors.push(`Missing required file: ${file}`);
  }
}

JSON.parse(readText("vercel.json"));
JSON.parse(readText("site.webmanifest"));

const contentUrl = new URL(`file://${path.join(root, "content.js")}`);
const { PORTFOLIO_DATA: data } = await import(contentUrl);

if (!data?.projects?.length) errors.push("No projects found in content.js");
if (!data?.skills || !Object.keys(data.skills).length) errors.push("No skills found in content.js");
if (!data.projects.some(project => project.featured)) warnings.push("No featured project selected");

const allSkills = Object.values(data.skills).flat();
const duplicateSkills = duplicateValues(allSkills);
const duplicateProjects = duplicateValues(data.projects.map(project => project.title));

if (duplicateSkills.length) errors.push(`Duplicate skills: ${duplicateSkills.join(", ")}`);
if (duplicateProjects.length) errors.push(`Duplicate projects: ${duplicateProjects.join(", ")}`);

for (const [index, project] of data.projects.entries()) {
  if (!project.title || !project.description || !project.technologies?.length) {
    errors.push(`Project ${index + 1} is missing required content`);
  }

  for (const key of ["url", "demoUrl"]) {
    if (project[key]) {
      try {
        new URL(project[key]);
      } catch {
        errors.push(`${project.title} has an invalid ${key}`);
      }
    }
  }
}

const html = readText("index.html");
const css = readText("style.css");
const content = readText("content.js");
const script = readText("portfolio.js");

const ids = [...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
const internalLinks = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);

for (const target of internalLinks) {
  if (!ids.includes(target)) errors.push(`Internal link target missing: #${target}`);
}

const duplicateIds = duplicateValues(ids);
if (duplicateIds.length) errors.push(`Duplicate HTML IDs: ${duplicateIds.join(", ")}`);

const emptyLinks = [...html.matchAll(/href="([^"]*)"/g)].filter(match => !match[1] || match[1] === "#");
if (emptyLinks.length) errors.push(`${emptyLinks.length} empty or placeholder link(s) found`);

const unsafeBlankLinks = [...html.matchAll(/<a[^>]*target="_blank"[^>]*>/g)].filter(match =>
  !/rel="[^"]*noopener[^"]*"/.test(match[0])
);
if (unsafeBlankLinks.length) errors.push(`${unsafeBlankLinks.length} external link(s) missing noopener`);

const localReferences = [...html.matchAll(/(?:href|src)="((?!https?:|mailto:|tel:|#)[^"]+)"/g)]
  .map(match => match[1]);

for (const reference of localReferences) {
  if (!fs.existsSync(path.join(root, reference))) {
    errors.push(`Missing local asset: ${reference}`);
  }
}

if (/Ã|Â|�|â€”|â†’/.test(html + css + content + script)) {
  errors.push("Encoding artifacts found in source files");
}

if (!html.includes('id="featured-project"') || !html.includes('id="skills-list"')) {
  errors.push("Dynamic content mount points are missing");
}

console.log(`Projects: ${data.projects.length}`);
console.log(`Skill groups: ${Object.keys(data.skills).length}`);
console.log(`Unique skills: ${allSkills.length}`);

for (const warning of warnings) console.warn(`Warning: ${warning}`);

if (errors.length) {
  for (const error of errors) console.error(`Error: ${error}`);
  process.exit(1);
}

console.log("Portfolio verification passed.");
