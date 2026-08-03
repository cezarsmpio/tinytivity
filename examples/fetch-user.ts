import { createState } from "@cezarsmpio/tinytivity";

type UserState = {
  status: "idle" | "loading" | "success" | "error";
  user: { name: string } | null;
  error: string | null;
};

const [userState, watchUserState] = createState<UserState>({
  status: "idle",
  user: null,
  error: null,
});

watchUserState((current) => {
  const { status, user, error } = current.value;

  if (status === "loading") console.log("loading user...");
  if (status === "success") console.log("loaded user:", user?.name);
  if (status === "error") console.log("failed to load user:", error);
});

async function fetchUser(id: number) {
  userState.value = { status: "loading", user: null, error: null };

  try {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/users/${id}`,
    );

    if (!response.ok) {
      throw new Error(`request failed with status ${response.status}`);
    }

    const user = await response.json();
    userState.value = { status: "success", user, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    userState.value = { status: "error", user: null, error: message };
  }
}

await fetchUser(1);
