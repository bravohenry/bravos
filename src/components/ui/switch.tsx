import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { useSound, Sounds } from "@/hooks/useSound";
import { useThemeStore } from "@/stores/useThemeStore";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, onCheckedChange, ...props }, ref) => {
  const { play: playClick } = useSound(Sounds.BUTTON_CLICK, 0.3);
  const theme = useThemeStore((s) => s.current);
  const isMacOSX = theme === "macosx";
  const isOS1 = theme === "os1";
  const [isChecked, setIsChecked] = React.useState(
    props.checked || props.defaultChecked || false
  );

  const handleCheckedChange = (checked: boolean) => {
    playClick();
    setIsChecked(checked);
    onCheckedChange?.(checked);
  };

  // For legacy / non-mac themes we provide minimal inline fallback styles.
  // macOSX and OS1 themes supply their own gradients & metrics in themes.css.
  const switchStyle: React.CSSProperties | undefined = isMacOSX || isOS1
    ? undefined
    : {
        backgroundColor: isChecked ? "#111827" : "#9ca3af", // gray-900 : gray-400
        borderRadius: "9999px",
        border: "none",
        boxShadow: "none",
      };

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer os-switch inline-flex shrink-0 cursor-pointer items-center transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        // OS1 theme uses CSS for sizing and border-radius, so don't apply default Tailwind classes
        isOS1 ? "" : "h-[16px] w-7 rounded-full",
        // Provide consistent horizontal padding for non-mac themes so travel distance is identical
        !isMacOSX && !isOS1 && "px-[2px]",
        className
      )}
      style={switchStyle}
      onCheckedChange={handleCheckedChange}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "os-switch-thumb pointer-events-none block bg-white transition-transform will-change-transform",
          // OS1 theme uses CSS for sizing and border-radius, so don't apply default Tailwind classes
          isOS1 ? "" : "h-[14px] w-[14px] rounded-full",
          // macOSX needs a slight negative offset when unchecked to appear visually centered inside bordered track
          isMacOSX && "data-[state=unchecked]:translate-x-[-2px]",
          // Translate by fixed distance when checked (Tailwind requires static class name)
          // OS1 theme uses CSS for transform, so don't apply default Tailwind classes
          !isOS1 && "data-[state=checked]:translate-x-[10px]"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
