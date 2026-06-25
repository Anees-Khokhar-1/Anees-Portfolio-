import { PORTFOLIO_DATA } from './content.js';

/**
 * Utility to safely construct DOM elements
 * Prevents XSS vulnerabilities inherent in innerHTML concatenation
 */
const createElement = (tag, attributes = {}, ...children) => {
  const element = document.createElement(tag);
  
  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined) continue;
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue;
      }
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (!child) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      child.forEach(c => c && element.appendChild(c instanceof Node ? c : document.createTextNode(String(c))));
    }
  }

  return element;
};

const renderProjectLink = (url, label) => {
  if (!url) return null;
  return createElement('a', { 
    className: 'project-link', 
    href: url, 
    target: '_blank', 
    rel: 'noopener noreferrer' 
  }, label);
};

const renderFeaturedProject = (project, targetElement) => {
  if (!project || !targetElement) return;

  const terminalLines = (project.terminalLines || []).map(line => 
    createElement('div', { className: 'terminal-line' }, 
      createElement('span', { className: line.tone || 'faint' }, '>'), 
      ` ${line.text}`
    )
  );

  const pills = project.technologies.map(tech => 
    createElement('span', { className: 'pill' }, tech)
  );

  const featureEl = createElement('div', { className: 'feature' },
    createElement('div', {},
      createElement('div', { className: 'project-index' }, `PROJECT_01 / ${project.category || 'FEATURED'}`),
      createElement('h3', { className: 'project-title' }, project.title),
      createElement('p', { className: 'project-copy' }, project.description),
      createElement('div', { className: 'pill-list' }, pills),
      createElement('div', { className: 'project-actions' },
        renderProjectLink(project.url, `${project.linkLabel || 'View project'} \u2197`),
        renderProjectLink(project.demoUrl, 'Watch demo \u25B6')
      )
    ),
    createElement('div', { className: 'terminal', 'aria-label': `${project.title} pipeline simulation` },
      createElement('div', { className: 'terminal-head' },
        createElement('span', { className: 'dots' }, 
          createElement('i'), createElement('i'), createElement('i')
        ),
        createElement('span', { className: 'terminal-file' }, project.terminalFile || 'project_pipeline.py')
      ),
      createElement('div', { className: 'terminal-body' },
        terminalLines,
        createElement('div', { className: 'faint terminal-line' },
          '// LRU cache hit / response reused ',
          createElement('span', { className: 'cursor' })
        )
      )
    )
  );

  targetElement.replaceChildren(featureEl);
};

const renderMiniProjects = (projects, targetElement) => {
  if (!projects || !projects.length || !targetElement) return;

  const projectElements = projects.map(project => 
    createElement('article', { className: 'mini-project' },
      createElement('div', {},
        createElement('h3', {}, project.title),
        createElement('p', {}, project.description),
        createElement('div', { className: 'project-actions' },
          renderProjectLink(project.url, 'View project \u2197'),
          renderProjectLink(project.demoUrl, 'Watch demo \u25B6')
        )
      ),
      createElement('div', { className: 'mini-stack' }, project.technologies.join(' / '))
    )
  );

  targetElement.replaceChildren(...projectElements);
};

const renderSkills = (skillsData, targetElement) => {
  if (!skillsData || !targetElement) return;

  const skillGroups = Object.entries(skillsData).map(([group, skills]) => 
    createElement('div', {},
      createElement('div', { className: 'skill-label' }, group),
      createElement('div', { className: 'skill-tags' },
        skills.map(skill => createElement('span', { className: 'pill' }, skill))
      )
    )
  );

  targetElement.replaceChildren(...skillGroups);
};

const initPortfolio = () => {
  if (!PORTFOLIO_DATA) return;

  const { projects, skills } = PORTFOLIO_DATA;
  const featured = projects.find(p => p.featured) || projects[0];
  const remaining = projects.filter(p => p !== featured);

  renderFeaturedProject(featured, document.querySelector('#featured-project'));
  renderMiniProjects(remaining, document.querySelector('#project-list'));
  renderSkills(skills, document.querySelector('#skills-list'));

  const countElement = document.querySelector('#project-count');
  if (countElement) {
    countElement.textContent = `${projects.length}+`;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPortfolio);
} else {
  initPortfolio();
}
