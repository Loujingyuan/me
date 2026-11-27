"use strict";

const $ = id => document.getElementById(id);
const historyFields = { name: "机构名称", image: "单位图标图片", role: "学位或职务", date: "时间", place: "地点", note: "简要说明", mark: "图标缩写（无图片时显示）", tone: "图标颜色（无图片时显示）" };
const linkFields = { label: "链接文字", url: "网址（含 https:// 或 http://）" };
const fixedSections = {
  profile: ["个人介绍", "home", { name: "中文名", englishName: "英文名", initials: "姓名缩写", portrait: "个人照片", email: "邮箱", topics: "研究方向（用逗号分隔）", intro: "个人介绍" }],
  education: ["教育背景", "home", historyFields],
  work: ["工作经历", "home", historyFields],
  interests: ["兴趣爱好", "about", { title: "爱好名称", image: "左侧配图", imageAlt: "图片说明", body: "介绍" }],
  social: ["社交链接", "about", { ...linkFields, image: "链接图标图片" }]
};
const articleFields = { title: "条目名称", role: "角色或机构", date: "时间", summary: "正文" };
const imageFields = { src: "选择原图", alt: "图片说明", caption: "图注" };
const multiline = new Set(["note", "intro", "summary", "body", "caption"]);
function normalize(profile) {
  const { projects, service, ...rest } = profile;
  return { ...rest, sections: readSections(profile) };
}
const tones = { ink: "灰", wine: "酒红", red: "红", blue: "蓝", green: "绿" };
const draftKey = "profile-editor-v1:" + location.pathname;
const original = JSON.stringify(window.profile);
let data = normalize(JSON.parse(original));
let section = "profile";
let index = 0;
let pendingImages = 0;

function status(text) { $("status").textContent = text; }
const draftDatabase = new Promise(resolve => {
  try {
    const request = indexedDB.open("personal-site-editor", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = request.onblocked = () => resolve(null);
  } catch { resolve(null); }
});

async function draftOperation(action, value) {
  const db = await draftDatabase;
  if (!db) {
    if (action === "get") return JSON.parse(localStorage.getItem(draftKey));
    localStorage.setItem(draftKey, JSON.stringify(value));
    return;
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("drafts", action === "get" ? "readonly" : "readwrite");
    const store = transaction.objectStore("drafts");
    const request = action === "get" ? store.get(draftKey) : store.put(value, draftKey);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function restoreDraft() {
  try {
    const stored = await draftOperation("get");
    const previous = stored ?? JSON.parse(localStorage.getItem(draftKey));
    if (previous && JSON.stringify(normalize(previous.data)) !== JSON.stringify(data)) {
      if (previous.base === original || confirm("网站内容已更新。继续使用本地草稿？选择取消将载入网站当前内容。")) {
        data = normalize(previous.data);
        status("已恢复此浏览器的草稿");
        return;
      }
      await draftOperation("put", { base: original, data });
    }
    status("已载入当前网站内容");
  } catch { status("已载入网站内容。可用「保存内容文件」保留修改。"); }
}
function activeSection() { return data.sections.find(item => item.id === section); }
function sectionSettings() { return fixedSections[section] ?? [activeSection()?.title, section, articleFields]; }
let previewQueued = false;
function preview() {
  if (previewQueued) return;
  previewQueued = true;
  requestAnimationFrame(() => {
    previewQueued = false;
    $("preview").contentWindow.postMessage({
      type: "profile-preview", profile: data, page: sectionSettings()[1], section, index
    }, location.protocol === "file:" ? "*" : location.origin);
  });
}
let saveRevision = 0;
async function changed() {
  preview();
  const revision = ++saveRevision;
  try {
    await draftOperation("put", { base: original, data });
    if (revision === saveRevision) status("草稿已保存到此浏览器");
  } catch {
    if (revision === saveRevision) status("草稿无法自动保存，请保存内容文件。");
  }
}
function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  if (className) item.className = className;
  return item;
}
function button(label, action) {
  const el = node("button", label);
  el.type = "button";
  el.addEventListener("click", action);
  return el;
}
function titleOf(item) { return item.name || item.title || item.label || "未命名条目"; }
function entriesForSection() { return activeSection()?.entries ?? data[section]; }
function current() { return section === "profile" ? data : entriesForSection()[index]; }
function contentFile() { return "window.profile = " + JSON.stringify(data, null, 2) + ";\n"; }
function blockExport(value) {
  for (const id of ["save", "download", "publish"]) $(id).disabled = value;
}

async function readOriginalImage(file) {
  const src = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = src;
  await image.decode();
  return src;
}
function cropFields(group, target, key) {
  const defaults = { x: 50, y: key === "portrait" ? 28 : 50, zoom: 1 };
  const details = node("details", "", "crop-controls");
  details.append(node("summary", "调整裁切"));
  details.append(node("p", "拖动滑块，在实时预览中查看裁切范围。"));
  const settings = [["zoom", "缩放", 1, 4, 0.05], ["x", "水平位置", 0, 100, 1], ["y", "垂直位置", 0, 100, 1]];
  const sliders = settings.map(([property, labelText, min, max, step]) => {
    const label = node("label", labelText);
    const slider = node("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = target.crop?.[property] ?? defaults[property];
    slider.oninput = () => {
      target.crop = { ...defaults, ...target.crop, [property]: slider.valueAsNumber };
      changed();
    };
    label.append(slider);
    details.append(label);
    return slider;
  });
  details.append(button("恢复默认裁切", () => {
    delete target.crop;
    sliders.forEach((slider, i) => { slider.value = defaults[settings[i][0]]; });
    changed();
  }));
  group.append(details);
  return details;
}
function photo(container, target, key, text) {
  const group = node("div", "", "photo-field");
  const label = node("label", text);
  const image = node("img", "", "thumb");
  image.alt = "";
  const input = node("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif";
  label.append(input);
  group.append(image, label);
  const crop = cropFields(group, target, key);
  const remove = button("移除图片", () => {
    delete target[key];
    delete target.crop;
    sync();
    changed();
  });
  if (key === "image") group.append(remove);
  function sync() {
    const src = target[key];
    image.hidden = crop.hidden = remove.hidden = !src;
    if (src) image.src = src;
    else image.removeAttribute("src");
  }
  if (key === "src") {
    const address = node("label", "或填写仓库图片路径");
    const path = node("input");
    path.placeholder = "assets/photo.jpg";
    path.value = target[key] && !target[key].startsWith("data:") ? target[key] : "";
    path.oninput = () => {
      const src = path.value.trim();
      if (!src && target[key]?.startsWith("data:")) return;
      if (src && /^(?:https?:\/\/|assets\/)/i.test(src)) target[key] = src;
      else delete target[key];
      sync();
      changed();
    };
    address.append(path);
    group.append(address);
    input.addEventListener("change", () => { if (input.files.length) path.value = ""; });
  }
  input.addEventListener("change", async () => {
    if (!input.files.length) return;
    pendingImages++;
    blockExport(true);
    input.disabled = true;
    remove.disabled = true;
    status("正在读取原图…");
    try {
      target[key] = await readOriginalImage(input.files[0]);
      sync();
      crop.open = true;
      changed();
    } catch { status("图片读取失败，请选择浏览器支持的图片文件。"); }
    finally {
      pendingImages--;
      blockExport(pendingImages > 0);
      input.value = "";
      input.disabled = false;
      remove.disabled = false;
    }
  });
  sync();
  container.append(group);
}
function fields(container, record, schema) {
  for (const [key, text] of Object.entries(schema)) {
    if (key === "portrait" || key === "src" || key === "image") { photo(container, record, key, text); continue; }
    const label = node("label", text);
    const input = node(key === "tone" ? "select" : multiline.has(key) ? "textarea" : "input");
    if (key === "tone") for (const [code, name] of Object.entries(tones)) input.add(new Option(name, code));
    if (multiline.has(key)) input.rows = 4;
    input.value = key === "topics" ? record.topics.join("，") : record[key] ?? "";
    input.addEventListener("input", () => {
      record[key] = key === "topics" ? input.value.split(/[,，]/).map(t => t.trim()).filter(Boolean) : input.value;
      if (record === current() && $("entry") && ["name", "title", "label"].includes(key)) {
        $("entry").options[index].text = titleOf(record);
      }
      changed();
    });
    label.append(input);
    container.append(label);
  }
}
function collection(container, project, key, text, schema) {
  const group = node("section", "", "collection");
  group.append(node("h3", text));
  const items = project[key] ?? [];
  for (const item of items) {
    const part = node("div", "", "nested");
    fields(part, item, schema);
    part.append(button("移除" + text, () => {
      if (!confirm("从草稿移除这条" + text + "？")) return;
      items.splice(items.indexOf(item), 1);
      drawFields();
      changed();
    }));
    group.append(part);
  }
  group.append(button("添加" + text, () => {
    project[key] = items;
    items.push({});
    drawFields();
    changed();
  }));
  container.append(group);
}
function drawFields() {
  const box = $("fields");
  box.replaceChildren();
  const record = current();
  if (!record) return;
  fields(box, record, sectionSettings()[2]);
  if (activeSection()) {
    collection(box, record, "links", "链接", linkFields);
    collection(box, record, "images", "左侧图片", imageFields);
  }
}
function drawSectionControls() {
  const select = $("section");
  const options = [
    ...Object.entries(fixedSections).slice(0, 3).map(([id, [label]]) => new Option(label, id)),
    ...data.sections.map(item => new Option(item.title || "未命名栏目", item.id)),
    ...Object.entries(fixedSections).slice(3).map(([id, [label]]) => new Option(label, id))
  ];
  select.replaceChildren(...options);
  select.value = section;
  const controls = $("section-controls");
  controls.replaceChildren();
  const actions = node("div", "", "record-actions");
  actions.append(button("新增栏目", () => {
    section = "section-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    data.sections.push({ id: section, title: "新栏目", entries: [] });
    index = 0;
    draw();
    $("section-title").focus();
    $("section-title").select();
    changed();
  }));
  const item = activeSection();
  if (item) {
    const position = data.sections.indexOf(item);
    for (const [label, delta] of [["栏目上移", -1], ["栏目下移", 1]]) {
      const next = position + delta;
      const move = button(label, () => {
        [data.sections[position], data.sections[next]] = [data.sections[next], data.sections[position]];
        draw();
        changed();
      });
      move.disabled = next < 0 || next >= data.sections.length;
      actions.append(move);
    }
    actions.append(button("删除栏目", () => {
      if (!confirm("从草稿删除栏目「" + (item.title || "未命名栏目") + "」及其中的所有条目？")) return;
      data.sections.splice(position, 1);
      section = data.sections[Math.min(position, data.sections.length - 1)]?.id ?? "profile";
      index = 0;
      draw();
      changed();
    }));
  }
  controls.append(actions);
  if (item) {
    const title = node("label", "栏目名称");
    const titleInput = node("input");
    titleInput.id = "section-title";
    titleInput.value = item.title;
    titleInput.oninput = () => {
      item.title = titleInput.value;
      select.selectedOptions[0].text = item.title || "未命名栏目";
      changed();
    };
    title.append(titleInput);
    const subtitle = node("label", "栏目副标题（可留空）");
    const subtitleInput = node("input");
    subtitleInput.value = item.subtitle ?? "";
    subtitleInput.oninput = () => { item.subtitle = subtitleInput.value; changed(); };
    subtitle.append(subtitleInput);
    controls.append(title, subtitle);
  }
}
function draw() {
  drawSectionControls();
  const picker = $("records");
  picker.replaceChildren();
  if (section !== "profile") {
    const entries = entriesForSection();
    const select = node("select");
    select.id = "entry";
    entries.forEach((item, i) => select.add(new Option(titleOf(item), String(i))));
    select.value = String(index);
    select.onchange = () => { index = select.selectedIndex; draw(); };
    const label = node("label", "选择条目");
    label.append(select);
    if (entries.length) picker.append(label);
    const actions = node("div", "", "record-actions");
    actions.append(button("新增条目", () => {
      entries.push(section === "education" || section === "work" ? { tone: "ink" } : {});
      index = entries.length - 1;
      draw(); changed();
      $("fields").querySelector("input")?.focus();
    }));
    if (entries.length) {
      for (const [text, offset] of [["上移", -1], ["下移", 1]]) {
        const next = index + offset;
        const move = button(text, () => {
          [entries[index], entries[next]] = [entries[next], entries[index]];
          index = next; draw(); changed();
        });
        move.disabled = next < 0 || next >= entries.length;
        actions.append(move);
      }
      actions.append(button("删除条目", () => {
        if (!confirm("从草稿删除「" + titleOf(current()) + "」？")) return;
        entries.splice(index, 1);
        index = Math.max(0, Math.min(index, entries.length - 1));
        draw(); changed();
      }));
    }
    picker.append(actions);
  }
  drawFields();
  preview();
}
function download() {
  const url = URL.createObjectURL(new Blob([contentFile()], { type: "text/javascript;charset=utf-8" }));
  const anchor = node("a");
  anchor.href = url;
  anchor.download = "content.js";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  status("已导出 content.js，请用它替换网站目录中的同名文件。");
}
$("save").onclick = async () => {
  if (!window.showSaveFilePicker) { download(); return; }
  try {
    const file = await window.showSaveFilePicker({ suggestedName: "content.js" });
    const writer = await file.createWritable();
    await writer.write(contentFile());
    await writer.close();
    status("内容文件已保存。保存到网站目录后，刷新网站即可查看。");
  } catch (error) {
    if (error.name === "AbortError") return;
    download();
  }
};
$("publish").onclick = () => $("publish-dialog").showModal();
$("download").onclick = download;
$("section").onchange = () => { section = $("section").value; index = 0; draw(); };
$("preview").addEventListener("load", preview);
blockExport(true);
$("section").disabled = true;
restoreDraft().then(() => {
  $("section").disabled = false;
  blockExport(false);
  draw();
});
