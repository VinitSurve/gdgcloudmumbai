import fs from "node:fs";
import path from "node:path";
import TeamUsaInteractions from "@/components/teamusa/TeamUsaInteractions";
import CSMTScrollScene from "@/components/CSMTScrollScene";

function getTeamUsaMarkup(): string {
  const markupPath = path.join(process.cwd(), "public", "teamusa-markup.html");
  const html = fs.readFileSync(markupPath, "utf8");
  return html;
}

export default function Home() {
  const markup = getTeamUsaMarkup();
  // Normalize markup newlines to avoid CRLF vs LF mismatches during hydration
  const normalized = markup.replace(/\r\n/g, '\n');

  // Inject CSMTScrollScene immediately after the opening <main> tag
  const mainStartIndex = normalized.indexOf('<main');
  const mainOpeningEnd = mainStartIndex !== -1 ? normalized.indexOf('>', mainStartIndex) + 1 : -1;

  const beforeMain = mainOpeningEnd !== -1 ? normalized.substring(0, mainOpeningEnd) : normalized;
  const afterMain = mainOpeningEnd !== -1 ? normalized.substring(mainOpeningEnd) : '';

  return (
    <>
      <div className="teamusa-clone" suppressHydrationWarning>
        <div dangerouslySetInnerHTML={{ __html: beforeMain }} suppressHydrationWarning />

        <section className="relative w-screen h-[400vh]">
          <div className="sticky top-0 w-screen h-screen overflow-hidden">
            <CSMTScrollScene />
          </div>
        </section>

        <div dangerouslySetInnerHTML={{ __html: afterMain }} suppressHydrationWarning />
      </div>
      <TeamUsaInteractions />
    </>
  );
}
