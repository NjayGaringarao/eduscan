export const generateHeader = (
  universityLogoDataUrl: string,
  eduscanLogoDataUrl: string
): string => {
  return `
    <div class="flex flex-row items-center justify-between">
      <!-- Left: University Logo -->
      <div class="flex-shrink-0">
        <img 
          src="${universityLogoDataUrl}" 
          alt="PRMSU Logo" 
          class="w-20 h-20 object-contain"
        />
      </div>

      <!-- Center: University Information -->
      <div class="flex-1 flex flex-col text-center items-center justify-center px-4">
        <p class="text-[12px] text-black">Republic of the Philippines</p>
        <p class="text-[14px] font-bold text-black">
          PRESIDENT RAMON MAGSAYSAY STATE UNIVERSITY
        </p>
        <p class="text-[10px] italic text-black -mt-1">
          (Formerly Ramon Magsaysay Technological University)
        </p>
        <p class="text-[12px] text-black">
          Castillejos, Zambales, Philippines
        </p>
      </div>

      <!-- Right: Eduscan Logo -->
      <div class="flex-shrink-0">
        <img 
          src="${eduscanLogoDataUrl}" 
          alt="Eduscan Logo" 
          class="w-16 h-16 object-contain"
        />
      </div>
    </div>
  `;
};
