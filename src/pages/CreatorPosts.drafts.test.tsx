import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { getFunctionName } from "convex/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  draftKey,
  postDraftSchema,
  readDraft,
  removeDraft,
  writeDraft,
} from "@/lib/formDrafts";
import CreatorPosts from "./CreatorPosts";
const f = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("convex/react", () => ({
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) =>
    getFunctionName(ref) === "creators/queries:myCreator"
      ? { _id: "draft-creator", displayName: "Test creator" }
      : [],
  usePaginatedQuery: () => ({
    results: [],
    status: "Exhausted",
    loadMore: vi.fn(),
  }),
  useMutation: () => f.save,
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() },
}));
vi.mock("@/components/dashboard/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => children,
}));
const key = draftKey("draft-creator", "post");
const original = {
  editId: "existing-post",
  title: "Original title",
  sport: "",
  event: "",
  pick: "",
  usOdds: "",
  euOdds: "",
  units: "1",
  tags: "",
  notes: "Original content",
  visibilityMode: "all" as const,
  selectedProductIds: [],
  oddsSource: null,
};
beforeEach(() => {
  f.save.mockReset();
  removeDraft(key);
});
afterEach(cleanup);
function show() {
  return render(
    <MemoryRouter initialEntries={["/creator/posts?demo=0"]}>
      <CreatorPosts />
    </MemoryRouter>,
  );
}
it("failed recovery save retains the existing post ID, then clears after successful retry", async () => {
  writeDraft(
    key,
    { ...original, title: "Recovered edit", notes: "Recovered content" },
    original,
  );
  f.save
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValue("existing-post");
  let view = show();
  expect(await screen.findByLabelText("Title *")).toHaveValue("Recovered edit");
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(f.save).toHaveBeenCalledOnce());
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled(),
  );
  expect(readDraft(key, postDraftSchema)?.data.editId).toBe("existing-post");
  view.unmount();
  view = show();
  expect(await screen.findByLabelText("Post *")).toHaveValue(
    "Recovered content",
  );
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(readDraft(key, postDraftSchema)).toBeNull());
  expect(f.save.mock.calls[1][0]).toMatchObject({
    postId: "existing-post",
    title: "Recovered edit",
  });
  view.unmount();
});
it("explicit discard restores the original post fields without a mutation", async () => {
  writeDraft(key, { ...original, title: "Discard this edit" }, original);
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Discard draft" }));
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(screen.getByLabelText("Title *")).toHaveValue("Original title");
  expect(f.save).not.toHaveBeenCalled();
  expect(readDraft(key, postDraftSchema)).toBeNull();
});

it('a newly published post becomes an edit target rather than a second new post', async () => {
  f.save.mockResolvedValue('created-post'); show();
  fireEvent.click(screen.getAllByRole('button', { name: 'Create Post' })[0]);
  fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'New post' } });
  fireEvent.change(screen.getByLabelText('Post *'), { target: { value: 'New content' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish Post' }));
  const success = await screen.findByRole('dialog');
  fireEvent.keyDown(success, { key: 'Escape' });
  await screen.findByRole('button', { name: 'Save changes' });
  expect(readDraft(key, postDraftSchema)).toBeNull();
});
