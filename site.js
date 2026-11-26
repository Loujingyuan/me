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
const pages = {
  home: { label: "首页", render: home },
  research: { label: "科研项目", render: research },
  service: { label: "社会服务", render: service },
  about: { label: "关于我", render: about }
};
const nav = document.querySelector("nav");
nav.innerHTML = Object.entries(pages).map(([key, page]) =>
  `<a href="#${key}">${icon(key)}<span>${page.label}</span></a>`
).join("");
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

function historySection(title, english, entries) {
  const rows = entries.map(item => `
    <li class="entry">
      <span class="seal ${esc(item.tone)}" aria-hidden="true">${esc(item.mark)}</span>
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
    </div><img class="portrait" src="${esc(person.portrait)}" alt="${esc(person.name)}的个人照片"></header>
    ${historySection("教育背景", "Education", person.education)}
    ${historySection("工作经历", "Experience", person.work)}`;
}
function pageTitle(title, english) {
  return `<header class="page-title"><h1>${title}</h1><p lang="en">${english}</p></header>`;
}
function links(items = []) {
  return items.filter(item => /^https?:\/\//i.test(item.url)).map(item =>
    `<a class="external" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${icon("link")}${esc(item.label)}</a>`
  ).join("");
}
function research() {
  return pageTitle("科研项目", "Research & Projects") + person.projects.map(p =>
    `<article><div class="meta">${esc(p.role)}<i>·</i>${esc(p.date)}</div><h2>${esc(p.title)}</h2>
    <p>${esc(p.summary)}</p>
    ${(p.images ?? []).map(img => `<figure><img loading="lazy" src="${esc(img.src)}" alt="${esc(img.alt)}">${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ""}</figure>`).join("")}
    <div class="links">${links(p.links)}</div></article>`
  ).join("");
}
function service() {
  return pageTitle("社会服务", "Community Service") + person.service.map(s =>
    `<article><h2>${esc(s.title)}</h2><div class="meta">${esc(s.meta)}</div><p>${esc(s.body)}</p></article>`
  ).join("");
}
function about() {
  return pageTitle("关于我", "Beyond Work") + person.interests.map(i =>
    `<article><h2>${esc(i.title)}</h2><p>${esc(i.body)}</p></article>`
  ).join("") + `<article><h2>联系与链接</h2><div class="links"><a class="external" href="mailto:${esc(person.email)}">${icon("mail")}${esc(person.email)}</a>${links(person.social)}</div></article>`;
}
const main = document.querySelector("main");
function showPage(focus = false, hash = location.hash.slice(1), resetScroll = true) {
  const key = Object.hasOwn(pages, hash) ? hash : "home";
  main.innerHTML = pages[key].render();
  document.title = pages[key].label + " · " + person.name;
  for (const anchor of nav.querySelectorAll("a")) {
    if (anchor.hash === "#" + key) anchor.setAttribute("aria-current", "page");
    else anchor.removeAttribute("aria-current");
  }
  if (focus) main.focus({ preventScroll: true });
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
    showPage(false, page, false);
    const target = [page, section, index].join("/");
    if (target === lastTarget) return;
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
