import { NextResponse } from "next/server";
import { accountAssociation, appConfig } from "../../../minikit.config";

export async function GET() {
  const miniapp = {
    version: "1",
    name: appConfig.name,
    subtitle: appConfig.subtitle,
    description: appConfig.description,
    homeUrl: appConfig.homeUrl,
    iconUrl: appConfig.iconUrl,
    splashImageUrl: appConfig.splashImageUrl,
    splashBackgroundColor: appConfig.splashBackgroundColor,
    heroImageUrl: appConfig.heroImageUrl,
    webhookUrl: appConfig.webhookUrl,
    primaryCategory: appConfig.primaryCategory,
    tags: [...appConfig.tags],
    requiredChains: [...appConfig.requiredChains],
    noindex: appConfig.noindex
  };

  const association = accountAssociation();
  return NextResponse.json({
    ...(association ? { accountAssociation: association } : {}),
    miniapp,
    frame: miniapp
  });
}
