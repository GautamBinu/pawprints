"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  ShieldCheck,
  TriangleAlert,
  Undo2,
  Save,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Petition, PetitionStatus } from "@/types/petition";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approvePetition,
  rejectPetition,
  returnPetition,
  unpublishPetition,
  addResponse,
  addUpdate,
} from "@/app/actions";
import {
  PETITION_CATEGORIES,
  PETITION_THRESHOLD,
  PETITION_TIERS,
} from "@/lib/constants";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getPetitionState } from "@/lib/petition-status";
import { formatDateTime, formatRelative } from "@/lib/dates";
import { evaluateReview } from "@/lib/review-stages";
import {
  setPetitionClassification,
  submitReview,
  withdrawReview,
} from "@/app/review-actions";
import { ReviewProgressPanel } from "./ReviewProgressPanel";
import { cn } from "@/lib/utils";
import { TimelineItem } from "./PetitionTimeline";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    ["link", "clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
];

/** Actions that ask before acting. Reject has its own dialog with a typed phrase. */
type ConfirmKind = "approve" | "return" | "override" | "unpublish";

/**
 * Exact phrase required to reject. Rejection is the one decision here with no
 * undo the author can trigger, so it costs a deliberate keystroke or twelve.
 */
const REJECT_PHRASE = "delete this petition";

const CONFIRM_COPY: Record<
  ConfirmKind,
  { title: string; body: string; action: string; destructive: boolean }
> = {
  approve: {
    title: "Approve this petition?",
    body: "",
    action: "Approve",
    destructive: false,
  },
  return: {
    title: "Return to the author?",
    body: "They are notified and asked to revise. When they resubmit, every approval so far is cleared and review starts again from the first stage.",
    action: "Return to author",
    destructive: false,
  },
  override: {
    title: "Publish now, skipping review?",
    body: "Bypasses every remaining stage and puts the petition live immediately. This is logged as a superadmin override.",
    action: "Publish now",
    destructive: false,
  },
  unpublish: {
    title: "Take this petition down?",
    body: "It disappears from the site straight away. Signatures already collected are kept.",
    action: "Take down",
    destructive: true,
  },
};

interface ReviewActionBoxProps {
  petition: Petition;
  permissions: number;
  isSuperAdmin: boolean;
  currentUserId: string | null;
  /** Stage keys whose reviewer list includes the signed-in user. */
  myStageKeys: string[];
}

/** A labelled row inside the box, one decision input or sub-action each. */
function BoxRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

/**
 * The decision panel, borrowed in shape from a pull request's merge box: a
 * headline stating where the petition stands, the inputs that decision needs,
 * and the actions themselves in a footer. It sits at the end of the timeline
 * so reading the page top to bottom ends at the thing to do about it.
 */
export function ReviewActionBox({
  petition,
  permissions,
  isSuperAdmin,
  currentUserId,
  myStageKeys,
}: ReviewActionBoxProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [category, setCategory] = useState(petition.tags[0]?.name ?? "");
  const [tier, setTier] = useState(String(petition.tier || 3));
  const [responseOpen, setResponseOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectPhrase, setRejectPhrase] = useState("");
  /** Which non-reject action is awaiting a yes. */
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  /** Ticked in the dialog when the action is an admin override. */
  const [overrideAcknowledged, setOverrideAcknowledged] = useState(false);
  const [responseContent, setResponseContent] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesComment, setChangesComment] = useState("");

  useEffect(() => {
    setCategory(petition.tags[0]?.name ?? "");
    setTier(String(petition.tier || 3));
  }, [petition]);

  const can = (bit: number) => isSuperAdmin || hasPermission(permissions, bit);

  const run = async (
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    setBusy(key);
    try {
      await action();
      toast.success(success);
      setResponseOpen(false);
      setUpdateOpen(false);
      setRejectOpen(false);
      setRejectPhrase("");
      setConfirm(null);
      setOverrideAcknowledged(false);
      setChangesOpen(false);
      setResponseContent("");
      setUpdateContent("");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Action failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const review = evaluateReview(
    petition.review_stage ?? 0,
    petition.reviews ?? [],
    petition.assignments ?? [],
  );
  const currentStage = review.current;
  const myReview = currentStage
    ? (petition.reviews ?? []).find(
        (entry) =>
          entry.stage === currentStage.index &&
          entry.reviewer.id === currentUserId,
      )
    : undefined;
  const isAssignedHere = !!currentStage?.assignments.some(
    (entry) => entry.assignee.id === currentUserId,
  );
  const isAuthor = petition.authorId === currentUserId;
  const onStageList =
    !!currentStage && myStageKeys.includes(currentStage.stage.key);
  // Being on the stage's reviewer list is what makes someone a reviewer. For
  // a stage that also requires assignment, the list is necessary but not
  // sufficient — this petition has to have named you. Authors never qualify.
  const normallyEligible =
    !!currentStage &&
    onStageList &&
    (!currentStage.stage.requiresAssignment || isAssignedHere);
  const canReview = !isAuthor && !!currentStage && (isSuperAdmin || normallyEligible);
  // A superadmin reviewing a stage they are not on the list for (or not
  // assigned to) is acting on someone else's behalf. The button says so, the
  // dialog asks twice, and the server logs it as an override.
  const isAdminOverride = canReview && isSuperAdmin && !normallyEligible;
  const overrideReason = !currentStage
    ? ""
    : !onStageList
      ? `You are not on the ${currentStage.stage.name} reviewer list.`
      : `You are not assigned to this petition for ${currentStage.stage.name}.`;

  // Whether the caller's approval would be the one that finishes review. Run
  // the same evaluator the server uses, against the reviews as they would be
  // with this approval recorded — so the dialog can say "this publishes it"
  // only when that is actually true.
  const willPublish = (() => {
    if (!currentStage || !currentUserId) return false;
    const others = (petition.reviews ?? []).filter(
      (entry) =>
        !(entry.stage === currentStage.index && entry.reviewer.id === currentUserId),
    );
    const hypothetical = evaluateReview(
      petition.review_stage ?? 0,
      [
        ...others,
        {
          id: -1,
          stage: currentStage.index,
          decision: "APPROVE",
          comment: null,
          created_at: new Date().toISOString(),
          reviewer: { id: currentUserId, name: "" },
        },
      ],
      petition.assignments ?? [],
    );
    return hypothetical.complete;
  })();

  // Nothing to hide behind a menu for a plain reviewer with none of these
  // permissions, so the trigger does not appear at all.
  const hasOverflow =
    can(PERMISSIONS.RETURN) || can(PERMISSIONS.REJECT) || isSuperAdmin;

  const state = getPetitionState(petition.status);
  const StateIcon = state.icon;
  const threshold = petition.targetSignatures || PETITION_THRESHOLD;
  const expired = new Date(petition.expires) < new Date();

  const headline: Record<number, { title: string; subtitle: string }> = {
    [PetitionStatus.NeedsReview]: {
      title: currentStage
        ? `Waiting on ${currentStage.stage.name}`
        : "Review complete",
      subtitle: currentStage
        ? currentStage.blocked
          ? "A reviewer has requested changes. The stage cannot pass until they approve or withdraw."
          : `${currentStage.approvalCount} of ${currentStage.stage.minApprovals} approvals${
              currentStage.awaitingAssignees.length > 0
                ? `, still waiting on ${currentStage.awaitingAssignees
                    .map((entry) => entry.assignee.name)
                    .join(", ")}`
                : ""
            }.`
        : "Every stage has been satisfied.",
    },
    [PetitionStatus.Published]: {
      title: expired ? "Published — collection closed" : "Published and live",
      subtitle: `${petition.signatures} of ${threshold} signatures · ${
        expired
          ? `expired ${formatRelative(petition.expires)}`
          : `expires ${formatRelative(petition.expires)}`
      }`,
    },
    [PetitionStatus.Returned]: {
      title: "Returned to the author",
      subtitle:
        "The author has to revise and resubmit before it can be reviewed again.",
    },
    [PetitionStatus.Removed]: {
      title: "Rejected",
      subtitle: "This petition is not visible on the site.",
    },
    [PetitionStatus.New]: {
      title: "Draft",
      subtitle: "The author has not submitted this for review yet.",
    },
  };

  const head = headline[petition.status] ?? {
    title: state.label,
    subtitle: "",
  };

  const pending = petition.status === PetitionStatus.NeedsReview;
  const published = petition.status === PetitionStatus.Published;

  return (
    <>
      <TimelineItem
        icon={StateIcon}
        iconClassName={state.iconClassName}
      >
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-start gap-3 px-4 py-4">
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                state.chipClassName,
              )}
            >
              <StateIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold">{head.title}</h2>
              {head.subtitle && (
                <p className="text-sm text-muted-foreground">{head.subtitle}</p>
              )}
            </div>
          </div>

          {pending && <ReviewProgressPanel stages={review.stages} />}

          {pending && (
            <div className="divide-y border-t">
              <BoxRow
                title="Category"
                description="Shown on the petition and used for filtering."
              >
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PETITION_CATEGORIES.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {entry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </BoxRow>

              <BoxRow
                title="Tier"
                description="Sets the signature target it has to reach."
              >
                <div className="flex items-center gap-2">
                  <Select value={tier} onValueChange={setTier}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Choose a tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {PETITION_TIERS.map((entry) => (
                        <SelectItem key={entry.id} value={String(entry.id)}>
                          {entry.name} — {entry.threshold} signatures
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      !can(PERMISSIONS.APPROVE) || !category || busy !== null
                    }
                    onClick={() =>
                      run(
                        "classify",
                        () =>
                          setPetitionClassification(
                            petition.id,
                            Number(tier),
                            category,
                          ),
                        "Classification saved",
                      )
                    }
                  >
                    {busy === "classify" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="sr-only sm:not-sr-only sm:ml-1.5">
                      Save
                    </span>
                  </Button>
                </div>
              </BoxRow>
            </div>
          )}

          {published && (
            <div className="divide-y border-t">
              <BoxRow
                icon={MessageSquare}
                title="Official response"
                description={
                  petition.response
                    ? `Posted ${formatDateTime(petition.response.created_at)} — a petition takes only one.`
                    : "Posting one closes the petition to further signatures."
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    !!petition.response ||
                    !can(PERMISSIONS.RESPONSE) ||
                    busy !== null
                  }
                  onClick={() => {
                    setResponseContent("");
                    setResponseOpen(true);
                  }}
                >
                  {petition.response ? "Response posted" : "Post response"}
                </Button>
              </BoxRow>

              <BoxRow
                icon={Megaphone}
                title="Updates"
                description={
                  petition.updates.length === 0
                    ? "Keep signers informed without closing the petition."
                    : `${petition.updates.length} posted`
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!can(PERMISSIONS.ADD_UPDATE) || busy !== null}
                  onClick={() => {
                    setUpdateContent("");
                    setUpdateOpen(true);
                  }}
                >
                  Post update
                </Button>
              </BoxRow>
            </div>
          )}

          {(pending || published) && (
            <div className="border-t bg-muted/40 px-4 py-3">
              {/* Two tiers, not one row of five. What a reviewer is here to
                  do sits on the left; returning, rejecting and the superadmin
                  override are one-off decisions and live behind the menu, out
                  of misclick range of Approve. */}
              <div className="flex flex-wrap items-center gap-2">
                {pending && canReview && currentStage && (
                  <>
                    <Button
                      className={
                        isAdminOverride
                          ? "border border-amber-500/60 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }
                      variant={isAdminOverride ? "outline" : "default"}
                      disabled={myReview?.decision === "APPROVE" || busy !== null}
                      onClick={() => setConfirm("approve")}
                      title={isAdminOverride ? overrideReason : undefined}
                    >
                      {busy === "approve" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : isAdminOverride ? (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      {myReview?.decision === "APPROVE"
                        ? "You approved"
                        : isAdminOverride
                          ? "Approve as admin"
                          : "Approve"}
                    </Button>

                    {myReview ? (
                      <Button
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() =>
                          run(
                            "withdraw",
                            () => withdrawReview(petition.id, currentStage.index),
                            "Review withdrawn",
                          )
                        }
                      >
                        {busy === "withdraw" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Undo2 className="mr-2 h-4 w-4" />
                        )}
                        Withdraw my review
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() => {
                          setChangesComment("");
                          setChangesOpen(true);
                        }}
                        title={isAdminOverride ? overrideReason : undefined}
                      >
                        {isAdminOverride ? (
                          <ShieldCheck className="mr-2 h-4 w-4 text-amber-600" />
                        ) : (
                          <TriangleAlert className="mr-2 h-4 w-4" />
                        )}
                        {isAdminOverride ? "Request changes as admin" : "Request changes"}
                      </Button>
                    )}
                  </>
                )}

                {published && (
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={!can(PERMISSIONS.UNPUBLISH) || busy !== null}
                    onClick={() => setConfirm("unpublish")}
                  >
                    {busy === "unpublish" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Take down
                  </Button>
                )}

                {pending && hasOverflow && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        aria-label="More review actions"
                        disabled={busy !== null}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Other decisions</DropdownMenuLabel>
                      {can(PERMISSIONS.RETURN) && (
                        <DropdownMenuItem onSelect={() => setConfirm("return")}>
                          <Undo2 className="mr-2 h-4 w-4" />
                          Return to author
                        </DropdownMenuItem>
                      )}
                      {can(PERMISSIONS.REJECT) && (
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setRejectOpen(true)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject petition
                        </DropdownMenuItem>
                      )}
                      {isSuperAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            Superadmin
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            disabled={!category}
                            onSelect={() => setConfirm("override")}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Publish now, skip review
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {published
                  ? "Taking it down removes it from the site but keeps its signatures."
                  : isAuthor
                    ? "You cannot review your own petition."
                    : isAdminOverride
                      ? `Admin override — ${overrideReason}`
                      : canReview
                        ? "It publishes on its own once every stage passes."
                        : currentStage?.needsAssignment
                        ? "Nobody is assigned to this stage yet."
                        : onStageList
                          ? "You have not been assigned to this petition."
                          : `You are not on the ${currentStage?.stage.name ?? "reviewer"} list.`}
              </p>
            </div>
          )}

        </div>
      </TimelineItem>

      <Dialog open={responseOpen} onOpenChange={setResponseOpen}>
        <DialogContent className="flex h-[80vh] flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Post official response</DialogTitle>
            <DialogDescription>
              A petition takes one response, and posting it closes the petition
              to further signatures. Signers and subscribers are notified. For
              ongoing progress, post an update instead.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-2 py-2">
            <Label htmlFor="response">Response content</Label>
            <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-input bg-background text-foreground focus-within:border-[#F76902] focus-within:ring-2 focus-within:ring-[#F76902] focus-within:ring-offset-2 focus-within:ring-offset-background">
              <ReactQuill
                theme="snow"
                value={responseContent}
                onChange={setResponseContent}
                modules={modules}
                formats={formats}
                className="petition-editor flex flex-1 flex-col text-foreground [&_.ql-container]:flex-1 [&_.ql-editor]:h-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setResponseOpen(false)}
              disabled={busy !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                run(
                  "response",
                  () => addResponse(petition.id, responseContent),
                  "Response posted",
                )
              }
              disabled={busy !== null || !responseContent.trim()}
            >
              {busy === "response" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Post response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="flex h-[80vh] flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Post status update</DialogTitle>
            <DialogDescription>
              Keeps signers informed without closing the petition.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-2 py-2">
            <Label htmlFor="update">Update content</Label>
            <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-input bg-background text-foreground focus-within:border-[#F76902] focus-within:ring-2 focus-within:ring-[#F76902] focus-within:ring-offset-2 focus-within:ring-offset-background">
              <ReactQuill
                theme="snow"
                value={updateContent}
                onChange={setUpdateContent}
                modules={modules}
                formats={formats}
                className="petition-editor flex flex-1 flex-col text-foreground [&_.ql-container]:flex-1 [&_.ql-editor]:h-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setUpdateOpen(false)}
              disabled={busy !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                run(
                  "update",
                  () => addUpdate(petition.id, updateContent),
                  "Update posted",
                )
              }
              disabled={busy !== null || !updateContent.trim()}
            >
              {busy === "update" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Post update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={changesOpen}
        onOpenChange={(open) => {
          setChangesOpen(open);
          if (!open) setOverrideAcknowledged(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>
              This blocks the stage until you approve or withdraw. The petition
              stays where it is — use &ldquo;Return to author&rdquo; if it needs
              rewriting before review can continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="changes-comment">What needs to change?</Label>
            <Textarea
              id="changes-comment"
              value={changesComment}
              onChange={(event) => setChangesComment(event.target.value)}
              placeholder="Optional, but it saves the author guessing."
              rows={4}
            />
          </div>
          {isAdminOverride && (
            <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 [&>svg]:text-amber-600">
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p>
                  <span className="font-semibold">Superadmin override.</span>{" "}
                  {overrideReason} This is flagged in the audit log.
                </p>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-amber-600"
                    checked={overrideAcknowledged}
                    onChange={(event) =>
                      setOverrideAcknowledged(event.target.checked)
                    }
                  />
                  <span>I understand this is an admin action.</span>
                </label>
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setChangesOpen(false)}
              disabled={busy !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                run(
                  "changes",
                  () =>
                    submitReview(
                      petition.id,
                      "CHANGES_REQUESTED",
                      changesComment,
                    ),
                  "Changes requested",
                )
              }
              disabled={busy !== null || (isAdminOverride && !overrideAcknowledged)}
            >
              {busy === "changes" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Request changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirm(null);
            setOverrideAcknowledged(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {confirm && (
            <>
              <DialogHeader>
                <DialogTitle>{CONFIRM_COPY[confirm].title}</DialogTitle>
                <DialogDescription>
                  {confirm === "approve"
                    ? willPublish
                      ? `Yours is the last approval needed. Approving publishes "${petition.title}" immediately and notifies the author and every subscriber.`
                      : `Records your approval for ${currentStage?.stage.name ?? "this stage"}. ${
                          currentStage && currentStage.approvalsRemaining > 1
                            ? `${currentStage.approvalsRemaining - 1} more will still be needed.`
                            : "Others assigned to this stage still have to approve."
                        }`
                    : CONFIRM_COPY[confirm].body}
                </DialogDescription>
              </DialogHeader>
              {confirm === "approve" && isAdminOverride && (
                <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 [&>svg]:text-amber-600">
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription className="space-y-2">
                    <p>
                      <span className="font-semibold">Superadmin override.</span>{" "}
                      {overrideReason} This approval is recorded under your
                      name and flagged as an override in the audit log.
                    </p>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-amber-600"
                        checked={overrideAcknowledged}
                        onChange={(event) =>
                          setOverrideAcknowledged(event.target.checked)
                        }
                      />
                      <span>
                        I understand I am approving on behalf of{" "}
                        {currentStage?.stage.name ?? "this stage"} without
                        being one of its reviewers.
                      </span>
                    </label>
                  </AlertDescription>
                </Alert>
              )}
              {confirm === "approve" && willPublish && (
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    This is the final sign-off. Once published, the petition
                    is live on the site and open for signatures.
                  </AlertDescription>
                </Alert>
              )}
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirm(null)}
                  disabled={busy !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant={CONFIRM_COPY[confirm].destructive ? "destructive" : "default"}
                  className={
                    confirm === "approve"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : undefined
                  }
                  disabled={
                    busy !== null ||
                    (confirm === "approve" && isAdminOverride && !overrideAcknowledged)
                  }
                  onClick={() => {
                    if (confirm === "approve") {
                      run(
                        "approve",
                        () => submitReview(petition.id, "APPROVE"),
                        willPublish ? "Approved and published" : "Approval recorded",
                      );
                    } else if (confirm === "return") {
                      run(
                        "return",
                        () => returnPetition(petition.id),
                        "Returned for changes",
                      );
                    } else if (confirm === "override") {
                      run(
                        "override",
                        () => approvePetition(petition.id, Number(tier), category),
                        "Published, skipping review",
                      );
                    } else if (confirm === "unpublish") {
                      run(
                        "unpublish",
                        () => unpublishPetition(petition.id),
                        "Petition taken down",
                      );
                    }
                  }}
                >
                  {busy !== null && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {confirm === "approve" && willPublish
                    ? "Approve and publish"
                    : CONFIRM_COPY[confirm].action}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) setRejectPhrase("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject this petition?</DialogTitle>
            <DialogDescription>
              The author is notified and the petition stops being visible. If
              it only needs changes, return it instead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-phrase">
              Type{" "}
              <span className="font-mono font-semibold">{REJECT_PHRASE}</span>{" "}
              to confirm
            </Label>
            <Input
              id="reject-phrase"
              value={rejectPhrase}
              onChange={(event) => setRejectPhrase(event.target.value)}
              placeholder={REJECT_PHRASE}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setRejectOpen(false)}
              disabled={busy !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                run(
                  "reject",
                  () => rejectPetition(petition.id),
                  "Petition rejected",
                )
              }
              disabled={
                busy !== null ||
                rejectPhrase.trim().toLowerCase() !== REJECT_PHRASE
              }
            >
              {busy === "reject" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject petition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReviewActionBox;
