import "vue";
declare module "vue" {
  interface ComponentCustomProps {
    "aria-hidden"?: string | boolean;
  }
  interface HTMLAttributes {
    [key: `data-${string}`]: string | number | boolean | undefined;
  }
}
