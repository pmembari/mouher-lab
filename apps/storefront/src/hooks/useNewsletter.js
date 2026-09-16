import { useCallback, useState } from "react";

export function useNewsletter({
  thanksMessage,
}) {
  const [email, setEmail] = useState("");

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (!email.trim()) {
        return;
      }

      alert(thanksMessage);
      setEmail("");
    },
    [email, thanksMessage]
  );

  return {
    email,
    setEmail,
    handleSubmit,
  };
}