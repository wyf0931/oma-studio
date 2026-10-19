<script lang="ts">
import { defineComponent, h } from "vue";
import type { PropType } from "vue";
import { templateIcons } from "./icons";
import type { IconName } from "./icons";
export default defineComponent({
  name: "OmaIcon",
  props: { name: { type: String as PropType<IconName>, required: true } },
  setup(props) {
    return () => h(templateIcons[props.name], { "data-lucide": props.name });
  },
});
</script>
