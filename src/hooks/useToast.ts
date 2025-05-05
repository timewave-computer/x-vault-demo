export const useToast = () => {
  const showToast = (input: {
    title: string;
    description?: string;
    type: "success" | "error" | "info";
    txHash?: string;
  }) => {
    console.log("TOAST:", input);
  };

  return { showToast };
};
