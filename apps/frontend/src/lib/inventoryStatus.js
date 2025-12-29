export function statusMeta(status) {
  switch (status) {
    case "DEAD":
      return {
        label: "DEAD",
        className: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
      };
    case "LOW":
      return {
        label: "LOW",
        className:
          "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
      };
    case "HEALTHY":
    default:
      return {
        label: "OK",
        className:
          "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
      };
  }
}
