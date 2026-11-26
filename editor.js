"use strict";

const $ = id => document.getElementById(id);
const historyFields = { name: "机构名称", image: "单位图标图片", role: "学位或职务", date: "时间", place: "地点", note: "简要说明", mark: "图标缩写（无图片时显示）", tone: "图标颜色（无图片时显示）" };
const linkFields = { label: "链接文字", url: "网址（含 https:// 或 http://）" };
const sections = {
  profile: ["个人介绍", "home", { name: "中文名", englishName: "英文名", initials: "姓名缩写", portrait: "个人照片", email: "邮箱", topics: "研究方向（用逗号分隔）", intro: "个人介绍" }],
  education: ["教育背景", "home", historyFields],
  work: ["工作经历", "home", historyFields],
  projects: ["科研项目", "research", { title: "项目名称", role: "项目角色", date: "时间", summary: "项目介绍" }],
  service: ["社会服务", "service", { title: "服务名称", image: "左侧配图", imageAlt: "图片说明", meta: "机构与时间", body: "服务经历" }],
  interests: ["兴趣爱好", "about", { title: "爱好名称", image: "左侧配图", imageAlt: "图片说明", body: "介绍" }],
  social: ["社交链接", "about", { ...linkFields, image: "链接图标图片" }]
};
const multiline = new Set(["note", "intro", "summary", "body"]);
const tones = { ink: "灰", wine: "酒红", red: "红", blue: "蓝", green: "绿" };
const draftKey = "profile-editor-v1:" + location.pathname;
const original = JSON.stringify(window.profile);
let data = JSON.parse(original);
let section = "profile";
let index = 0;
let pendingImages = 0;

function status(text) { $("status").textContent = text; }
function restoreDraft() {
  try {
    const previous = JSON.parse(localStorage.getItem(draftKey));
    if (previous && JSON.stringify(previous.data) !== original &&
        (previous.base === original || confirm("网站内容已更新。是否继续使用此浏览器上次保存的草稿？选择取消将载入当前网站。"))) {
      data = previous.data;
      status("已恢复此浏览器的草稿");
    } else {
      localStorage.removeItem(draftKey);
      status("已载入当前网站内容");
    }
  } catch { status("已载入网站内容。可用「保存内容文件」保留修改。"); }
}
function preview() {
  $("preview").contentWindow.postMessage({
    type: "profile-preview", profile: data, page: sections[section][1], section, index
  }, location.protocol === "file:" ? "*" : location.origin);
}
function changed() {
  preview();
  try {
    localStorage.setItem(draftKey, JSON.stringify({ base: original, data }));
    status("草稿已保存到此浏览器");
  } catch { status("浏览器草稿空间不足或不可用，请保存内容文件。"); }
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
function current() { return section === "profile" ? data : data[section][index]; }
function contentFile() { return "window.profile = " + JSON.stringify(data, null, 2) + ";\n"; }
function blockExport(value) {
  for (const id of ["save", "download", "publish"]) $(id).disabled = value;
}

async function loadImage(file, square) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const crop = Math.min(image.naturalWidth, image.naturalHeight);
    const width = square ? crop : image.naturalWidth;
    const height = square ? crop : image.naturalHeight;
    const scale = Math.min(1, (square ? 256 : 1440) / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, (image.naturalWidth - width) / 2, (image.naturalHeight - height) / 2,
      width, height, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(square ? "image/webp" : "image/jpeg", 0.82);
  } finally { URL.revokeObjectURL(url); }
}
function photo(container, target, key, text) {
  const square = key !== "portrait";
  const group = node("div", "", "photo-field");
  const label = node("label", text);
  const image = node("img", "", square ? "thumb square-thumb" : "thumb");
  image.alt = "";
  if (target[key]) { image.src = target[key]; group.append(image); }
  const input = node("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp";
  const remove = button("移除图片", () => {
    delete target[key];
    image.remove();
    remove.hidden = true;
    changed();
  });
  remove.hidden = !target[key];
  input.addEventListener("change", async () => {
    if (!input.files.length) return;
    pendingImages++;
    blockExport(true);
    input.disabled = true;
    remove.disabled = true;
    status("正在处理图片…");
    try {
      target[key] = await loadImage(input.files[0], square);
      image.src = target[key];
      group.prepend(image);
      remove.hidden = false;
      changed();
    } catch { status("图片读取失败，请选择 JPG、PNG 或 WebP 文件。"); }
    finally {
      pendingImages--;
      blockExport(pendingImages > 0);
      input.value = "";
      input.disabled = false;
      remove.disabled = false;
    }
  });
  label.append(input);
  group.append(label);
  if (key === "image") group.append(remove);
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
  fields(box, record, sections[section][2]);
  if (section === "projects") {
    collection(box, record, "links", "项目链接", linkFields);
    collection(box, record, "images", "项目图片", { src: "选择左侧图片", alt: "图片说明", caption: "图注" });
  }
}
function draw() {
  const picker = $("records");
  picker.replaceChildren();
  if (section !== "profile") {
    const entries = data[section];
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
for (const [key, [label]] of Object.entries(sections)) $("section").add(new Option(label, key));
$("section").onchange = () => { section = $("section").value; index = 0; draw(); };
$("preview").addEventListener("load", preview);
restoreDraft();
draw();
