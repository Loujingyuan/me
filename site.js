"use strict";

let person = window.profile;
const icons = {
  home: '<path d="m3 10 9-7 9 7v10H15v-6H9v6H3z"/>',
  research: '<path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h7l2 2h8v2"/>',
  service: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5"/>',
  about: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  link: '<path d="m10 13 4-4m-5 6-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0m0 10a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-1 1"/>'
};
function icon(name) {
  return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>';
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
const nav = document.querySelector("nav");
function sitePages() {
  const sections = readSections(person).map(section => [
    section.id, {
      label: section.title || "未命名栏目",
      icon: section.id === "service" ? "service" : "research",
      render: () => contentSection(section)
    }
  ]);
  return new Map([
    ["home", { label: "首页", icon: "home", render: home }],
    ...sections,
    ["about", { label: "关于我", icon: "about", render: about }]
  ]);
}
function updateIdentity() {
  document.querySelector(".monogram").textContent = person.initials;
  document.querySelector("#side-name").textContent = person.name;
  document.querySelector("#side-english").textContent = person.englishName;
  document.querySelector("#copyright").textContent = "© " + new Date().getFullYear() + " " + person.englishName;
  const email = document.querySelector("#side-email");
  email.href = "mailto:" + person.email;
  email.innerHTML = icon("mail") + esc(person.email);
}
updateIdentity();

function scaleValue(value, fallback, min, max) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}
function croppedImage(src, alt = "", crop = {}, className = "entry-image") {
  const x = scaleValue(crop.x, 50, 0, 100);
  const y = scaleValue(crop.y, 50, 0, 100);
  const zoom = scaleValue(crop.zoom, 1, 1, 4);
  return `<span class="crop-frame ${className}" style="--crop-x:${x}%;--crop-y:${y}%;--crop-zoom:${zoom}"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"></span>`;
}

function historySection(title, english, entries) {
  const rows = entries.map(item => `
    <li class="entry">
      ${item.image ? croppedImage(item.image, "", item.crop) : `<span class="seal ${esc(item.tone)}" aria-hidden="true">${esc(item.mark)}</span>`}
      <div class="entry-body"><div class="entry-heading"><h3>${esc(item.name)}</h3><span class="date">${esc(item.date)}</span></div>
      <p class="role">${esc(item.role)}</p>
      ${item.place ? `<p class="place">${esc(item.place)}</p>` : ""}
      ${item.note ? `<p class="note">${esc(item.note)}</p>` : ""}</div>
    </li>`).join("");
  return `<section class="history"><div class="section-title"><h2>${title}</h2><span lang="en">${english}</span></div><ul class="entries">${rows}</ul></section>`;
}
function home() {
  return `<header class="hero"><div class="hero-text">
    <h1>${esc(person.name)}</h1><p class="english-name" lang="en">${esc(person.englishName)}</p>
    <div class="topics">${person.topics.map(t => `<span>${esc(t)}</span>`).join("")}</div>
    <p class="intro">${esc(person.intro)}</p>
    <a class="button" href="mailto:${esc(person.email)}">${icon("mail")}联系我</a>
    </div>${croppedImage(person.portrait, person.name + "的个人照片", person.crop ?? { y: 28 }, "portrait")}</header>
    ${historySection("教育背景", "Education", person.education)}
    ${historySection("工作经历", "Experience", person.work)}`;
}
function pageTitle(title, english) {
  return `<header class="page-title"><h1>${esc(title)}</h1>${english ? `<p lang="en">${esc(english)}</p>` : ""}</header>`;
}
function links(items = []) {
  return items.filter(item => /^https?:\/\//i.test(item.url)).map(item =>
    `<a class="external" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${item.image ? croppedImage(item.image, "", item.crop) : icon("link")}${esc(item.label)}</a>`
  ).join("");
}
function articleWithImages(content, images) {
  const figures = images.filter(img => img.src).map(img =>
    `<figure>${croppedImage(img.src, img.alt || "", img.crop, "article-image")}${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ""}</figure>`
  ).join("");
  if (!figures) return `<article>${content}</article>`;
  return `<article class="illustrated"><div class="entry-images">${figures}</div><div class="article-text">${content}</div></article>`;
}
function contentSection(section) {
  return pageTitle(section.title || "未命名栏目", section.subtitle) + section.entries.map(item => {
    const details = [item.role, item.date].filter(Boolean).map(esc).join(" · ");
    return articleWithImages(
      `${details ? `<div class="meta">${details}</div>` : ""}<h2>${esc(item.title)}</h2>
      ${item.summary ? `<p>${esc(item.summary)}</p>` : ""}<div class="links">${links(item.links)}</div>`,
      item.images ?? []
    );
  }).join("");
}
function about() {
  return pageTitle("关于我", "Beyond Work") + person.interests.map(i =>
    articleWithImages(`<h2>${esc(i.title)}</h2><p>${esc(i.body)}</p>`, [{ src: i.image, alt: i.imageAlt, crop: i.crop }])
  ).join("") + `<article><h2>联系与链接</h2><div class="links"><a class="external" href="mailto:${esc(person.email)}">${icon("mail")}${esc(person.email)}</a>${links(person.social)}</div></article>`;
}
const main = document.querySelector("main");
function showPage(focus = false, hash = location.hash.slice(1), resetScroll = true) {
  const pages = sitePages();
  const key = pages.has(hash) ? hash : "home";
  const page = pages.get(key);
  const focusNav = nav.contains(document.activeElement);
  nav.innerHTML = Array.from(pages, ([id, item]) =>
    `<a href="#${esc(id)}"${id === key ? ' aria-current="page"' : ""}>${icon(item.icon)}<span>${esc(item.label)}</span></a>`
  ).join("");
  main.innerHTML = page.render();
  document.title = page.label + " · " + person.name;
  if (focusNav) nav.querySelector("[aria-current]").focus({ preventScroll: true });
  else if (focus) main.focus({ preventScroll: true });
  if (resetScroll) window.scrollTo(0, 0);
}
document.querySelector(".skip").addEventListener("click", event => {
  event.preventDefault();
  main.focus();
});
window.addEventListener("hashchange", () => showPage(true));
showPage();

// The editor sends its draft only to its own preview frame.
if (window.parent !== window && location.search === "?preview") {
  let lastTarget;
  window.addEventListener("message", event => {
    if (event.source !== parent || event.data?.type !== "profile-preview") return;
    const localFile = location.protocol === "file:" && ["null", "file://"].includes(event.origin);
    if (!localFile && event.origin !== location.origin) return;
    const { profile, page, section, index } = event.data;
    person = profile;
    updateIdentity();
    const scroll = window.scrollY;
    showPage(false, page, false);
    const target = [page, section, index].join("/");
    if (target === lastTarget) { window.scrollTo(0, scroll); return; }
    lastTarget = target;
    let entry;
    if (section === "education" || section === "work") {
      const group = main.querySelectorAll(".history")[section === "work" ? 1 : 0];
      entry = group?.querySelectorAll(".entry")[index] || group;
    } else if (section !== "profile") {
      const articles = main.querySelectorAll("article");
      entry = section === "social" ? articles[articles.length - 1] : articles[index];
    }
    if (entry) window.scrollTo(0, entry.getBoundingClientRect().top + window.scrollY - 60);
    else window.scrollTo(0, 0);
  });
}
