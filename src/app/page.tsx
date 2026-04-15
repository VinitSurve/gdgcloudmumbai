import fs from "node:fs";
import path from "node:path";
import TeamUsaInteractions from "@/components/teamusa/TeamUsaInteractions";

function getTeamUsaMarkup(): string {
  const markupPath = path.join(process.cwd(), "public", "teamusa-markup.html");
  return fs.readFileSync(markupPath, "utf8");
}

export default function Home() {
  const markup = getTeamUsaMarkup();

  return (
    <>
      <div
        className="teamusa-clone"
        dangerouslySetInnerHTML={{ __html: markup }}
        suppressHydrationWarning
      />
      <TeamUsaInteractions />
    </>
  );
}
