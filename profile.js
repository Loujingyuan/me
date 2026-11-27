// Read both the original résumé format and content exported by the editor.
function readSections(profile) {
  if (Array.isArray(profile.sections)) return profile.sections;
  return [
    { id: "research", title: "科研项目", subtitle: "Research & Projects", entries: profile.projects ?? [] },
    {
      id: "service", title: "社会服务", subtitle: "Community Service",
      entries: (profile.service ?? []).map(({ title, meta, body, image, imageAlt, crop }) => ({
        title, role: meta, summary: body,
        images: image ? [{ src: image, alt: imageAlt, crop }] : []
      }))
    }
  ];
}
