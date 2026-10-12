const list = document.getElementById('documents');
const count = document.getElementById('count');
const search = document.getElementById('search');
let documents = [];

function localLink(path) {
  const url = new URL(path, location.href);
  if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Document links must be local HTTP paths.');
  }
  return url.href;
}

function render() {
  const query = search.value.trim().toLocaleLowerCase('vi');
  const filtered = documents.filter(doc =>
    [doc.title, doc.group, doc.description].join(' ').toLocaleLowerCase('vi').includes(query));
  list.replaceChildren();
  count.textContent = `${filtered.length} tài liệu`;
  const groups = new Map();
  for (const doc of filtered) {
    const group = doc.group || 'Tài liệu';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(doc);
  }
  for (const [name, entries] of groups) {
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = name;
    section.append(heading);
    for (const doc of entries) {
      const article = document.createElement('article');
      article.className = 'document';
      const title = document.createElement('h3');
      title.textContent = doc.title;
      if (doc.demo) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = 'DEMO';
        title.append(badge);
      }
      const links = document.createElement('nav');
      links.setAttribute('aria-label', doc.title);
      for (const [key, label] of [['html', 'Xem HTML'], ['pdf', 'PDF gốc']]) {
        const target = doc[key];
        if (!target) continue;
        const link = document.createElement('a');
        link.href = localLink(target);
        link.textContent = label;
        links.append(link);
      }
      article.append(title);
      if (doc.description) {
        const description = document.createElement('p');
        description.textContent = doc.description;
        article.append(description);
      }
      article.append(links);
      section.append(article);
    }
    list.append(section);
  }
  if (!filtered.length) list.textContent = 'Không có tài liệu phù hợp.';
}

search.addEventListener('input', render);
fetch('metadata/documents.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(data => {
    if (!Array.isArray(data)) throw new Error('Expected a document array.');
    documents = data;
    render();
  })
  .catch(error => {
    count.textContent = 'Không tải được danh mục.';
    list.textContent = 'Hãy mở trang qua HTTP server. Xem hướng dẫn chạy local trong README.';
    console.error(error);
  });
