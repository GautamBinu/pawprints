"use client";

import React from "react";
import { Petition, PetitionStatus } from "../../types/petition";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "../ui/drawer";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  CalendarIcon,
  UserIcon,
  PenToolIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2,
  LinkIcon,
  X,
  Share2,
} from "lucide-react";
import { useMediaQuery } from "../../hooks/use-media-query";
import { useAuth } from "../../app/auth/AuthContext";
import {
  signPetition,
  unsignPetition,
  getPetitionSignatureStatus,
  publishPetition,
  updatePetition,
  checkAdminAccess,
  addUpdate,
  addResponse,
  editUpdate,
  editResponse,
} from "../../app/actions";
import { toast } from "sonner";
import PetitionForm, { PetitionFormData } from "../PetitionForm/PetitionForm";
import dynamic from "next/dynamic";
import { PlusIcon } from "lucide-react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "indent",
  "link",
];

interface PetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  petition: Petition | null;
  initialIsAuthor?: boolean;
  onPetitionUpdated?: (petition: Petition) => void;
  isReviewMode?: boolean;
  onApprove?: (petition: Petition) => void;
  onReject?: (petition: Petition) => void;
}

const TARGET_SIGNATURES = 200; // Default target

const getStatusInfo = (status: PetitionStatus) => {
  switch (status) {
    case PetitionStatus.New:
      return {
        text: "New",
        color: "text-orange-600",
        badge: "bg-orange-100 text-orange-800",
      };
    case PetitionStatus.Published:
      return {
        text: "Published",
        color: "text-green-600",
        badge: "bg-green-100 text-green-800",
      };
    case PetitionStatus.Removed:
      return {
        text: "Removed",
        color: "text-red-600",
        badge: "bg-red-100 text-red-800",
      };
    case PetitionStatus.NeedsReview:
      return {
        text: "Needs Review",
        color: "text-yellow-600",
        badge: "bg-yellow-100 text-yellow-800",
      };
    default:
      return {
        text: "Unknown",
        color: "text-gray-600",
        badge: "bg-gray-100 text-gray-800",
      };
  }
};

const PetitionModal: React.FC<PetitionModalProps> = ({
  isOpen,
  onClose,
  petition: initialPetition,
  initialIsAuthor = false,
  onPetitionUpdated,
  isReviewMode = false,
  onApprove,
  onReject,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { user } = useAuth();

  const [petition, setPetition] = React.useState<Petition | null>(
    initialPetition,
  );
  const [isSigned, setIsSigned] = React.useState(false);
  const [isAuthor, setIsAuthor] = React.useState(initialIsAuthor);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isLoadingSign, setIsLoadingSign] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isAddingUpdate, setIsAddingUpdate] = React.useState(false);
  const [isAddingResponse, setIsAddingResponse] = React.useState(false);
  const [editingUpdateId, setEditingUpdateId] = React.useState<number | null>(
    null,
  );
  const [editingResponseId, setEditingResponseId] = React.useState<
    number | null
  >(null);
  const [adminContent, setAdminContent] = React.useState("");

  React.useEffect(() => {
    setPetition(initialPetition);
  }, [initialPetition]);

  React.useEffect(() => {
    setIsEditing(false);
    setIsAddingUpdate(false);
    setIsAddingResponse(false);
    setEditingUpdateId(null);
    setEditingResponseId(null);
    setAdminContent("");

    if (isOpen && petition && user) {
      setIsLoadingSign(true);

      // Check admin status
      checkAdminAccess().then(setIsAdmin).catch(console.error);

      if (initialIsAuthor) {
        setIsAuthor(true);
      }

      getPetitionSignatureStatus(petition.id)
        .then((status) => {
          setIsSigned(status.signed);
          setIsAuthor(status.isAuthor);
        })
        .catch(console.error)
        .finally(() => setIsLoadingSign(false));
    } else {
      setIsSigned(false);
      setIsAuthor(initialIsAuthor);
      setIsAdmin(false);
    }
  }, [isOpen, petition?.id, user, initialIsAuthor]); // Removed petition from dependency to avoid loop if we update it locally, but we need to react to ID changes

  const handleUpdate = async (data: PetitionFormData) => {
    if (!petition) return;
    setIsLoadingSign(true);
    try {
      const updatedPetition = await updatePetition(petition.id, {
        title: data.title,
        description: data.description,
        tags: [data.category],
        expires: data.expiresDate,
      });
      toast.success("Petition updated successfully");
      setIsEditing(false);
      setPetition(updatedPetition);
      if (onPetitionUpdated) {
        onPetitionUpdated(updatedPetition);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update petition");
    } finally {
      setIsLoadingSign(false);
    }
  };

  const handleAdminAction = async (
    action: "addUpdate" | "addResponse" | "editUpdate" | "editResponse",
  ) => {
    if (!petition) return;
    setIsLoadingSign(true);
    try {
      if (action === "addUpdate") {
        const newUpdate = await addUpdate(petition.id, adminContent);
        toast.success("Update added successfully");
        setIsAddingUpdate(false);

        // Update local state
        const updatedPetition = {
          ...petition,
          updates: [newUpdate, ...petition.updates],
        };
        setPetition(updatedPetition);
        if (onPetitionUpdated) onPetitionUpdated(updatedPetition);
      } else if (action === "addResponse") {
        const newResponse = await addResponse(petition.id, adminContent);
        toast.success("Response added successfully");
        setIsAddingResponse(false);

        // Update local state
        const updatedPetition = {
          ...petition,
          hasResponse: true,
          response: newResponse,
        };
        setPetition(updatedPetition);
        if (onPetitionUpdated) onPetitionUpdated(updatedPetition);
      } else if (action === "editUpdate" && editingUpdateId) {
        const updatedUpdate = await editUpdate(editingUpdateId, adminContent);
        toast.success("Update edited successfully");
        setEditingUpdateId(null);

        // Update local state
        const updatedPetition = {
          ...petition,
          updates: petition.updates.map((u) =>
            u.id === editingUpdateId ? updatedUpdate : u,
          ),
        };
        setPetition(updatedPetition);
        if (onPetitionUpdated) onPetitionUpdated(updatedPetition);
      } else if (action === "editResponse" && editingResponseId) {
        const updatedResponse = await editResponse(
          editingResponseId,
          adminContent,
        );
        toast.success("Response edited successfully");
        setEditingResponseId(null);

        // Update local state
        const updatedPetition = {
          ...petition,
          response: updatedResponse,
        };
        setPetition(updatedPetition);
        if (onPetitionUpdated) onPetitionUpdated(updatedPetition);
      }

      setAdminContent("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to perform action");
    } finally {
      setIsLoadingSign(false);
    }
  };

  const handleAddUpdate = () => handleAdminAction("addUpdate");
  const handleAddResponse = () => handleAdminAction("addResponse");
  const canManage = isAdmin && petition?.status !== PetitionStatus.New;

  const handleSign = async () => {
    if (!petition || !user) return;
    setIsLoadingSign(true);
    try {
      if (isSigned) {
        await unsignPetition(petition.id);
        setIsSigned(false);
        toast.success("Petition unsigned successfully");
      } else {
        await signPetition(petition.id);
        setIsSigned(true);
        toast.success("Petition signed successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update signature status",
      );
    } finally {
      setIsLoadingSign(false);
    }
  };

  const handlePublish = async () => {
    if (!petition || !user) return;
    setIsLoadingSign(true);
    try {
      await publishPetition(petition.id);
      toast.success("Petition submitted for review");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to publish petition",
      );
    } finally {
      setIsLoadingSign(false);
    }
  };

  if (!petition) return null;

  const progressPercentage = Math.min(
    (petition.signatures / TARGET_SIGNATURES) * 100,
    100,
  );
  const statusInfo = getStatusInfo(petition.status);

  const getProgressBarColor = () => {
    if (petition.signatures >= TARGET_SIGNATURES) {
      return "bg-green-500";
    }
    return "bg-orange-500";
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const renderDescription = () => (
    <div id="description" className="space-y-2 scroll-mt-4">
      <h3 className="text-lg font-semibold">Description</h3>
      <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-900/10 rounded-md shadow-none">
        <CardContent className="p-y-1">
          <div
            className="text-foreground text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert [&_h1]:!text-foreground [&_h2]:!text-foreground [&_h3]:!text-foreground [&_p]:!text-foreground [&_strong]:!text-foreground [&_li]:!text-foreground"
            dangerouslySetInnerHTML={{ __html: petition.description }}
          />

          <div className="flex flex-wrap gap-2 mt-8 justify-end">
            {petition.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="font-mono text-xs uppercase"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUpdates = () => {
    const hasUpdates = petition.updates && petition.updates.length > 0;
    if (!canManage && !hasUpdates) return null;

    return (
      <div id="updates" className="space-y-4 scroll-mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Updates</h3>
          {canManage && !isAddingUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingUpdate(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Update
            </Button>
          )}
        </div>

        {isAddingUpdate && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">New Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <ReactQuill
                  theme="snow"
                  value={adminContent}
                  onChange={setAdminContent}
                  modules={modules}
                  formats={formats}
                  className="petition-editor min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsAddingUpdate(false);
                    setAdminContent("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUpdate}
                  disabled={isLoadingSign || !adminContent.trim()}
                >
                  {isLoadingSign && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Post Update
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {petition.updates && petition.updates.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-muted space-y-6 ml-2">
            {petition.updates.map((update) => (
              <div key={update.id} className="relative">
                <Card className="rounded-md shadow-none">
                  <CardHeader className="p-y-1">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Update</CardTitle>
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(update.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-y-1">
                    <div
                      className="text-sm prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: update.description }}
                    />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          !isAddingUpdate && (
            <p className="text-sm text-muted-foreground italic">
              No updates yet.
            </p>
          )
        )}
      </div>
    );
  };

  const renderResponse = () => {
    const hasResponse = !!petition.response;
    if (!canManage && !hasResponse) return null;

    return (
      <div id="response" className="space-y-2 scroll-mt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Official Response</h3>
          {canManage && !isAddingResponse && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddingResponse(true);
                setAdminContent(petition.response?.description || "");
              }}
            >
              <PenToolIcon className="h-4 w-4 mr-2" />
              {petition.response ? "Edit Response" : "Add Response"}
            </Button>
          )}
        </div>

        {isAddingResponse ? (
          <Card className="border-dashed border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="text-base">
                {petition.response ? "Edit Response" : "New Response"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <ReactQuill
                  theme="snow"
                  value={adminContent}
                  onChange={setAdminContent}
                  modules={modules}
                  formats={formats}
                  className="petition-editor min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsAddingResponse(false);
                    setAdminContent("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddResponse}
                  disabled={isLoadingSign || !adminContent.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoadingSign && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Post Response
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : petition.response ? (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10 rounded-md shadow-none">
            <CardHeader className="p-y-1">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base text-green-700 dark:text-green-400">
                  Response from {petition.response.author}
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(petition.response.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-y-1 pt-0">
              <div
                className="text-sm prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: petition.response.description,
                }}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  };

  const renderPetitionBody = () => {
    if (isEditing) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit Petition</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
          <PetitionForm
            onSubmit={handleUpdate}
            isSubmitting={isLoadingSign}
            submitLabel="Save Changes"
            initialValues={{
              title: petition.title,
              description: petition.description,
              category: petition.tags[0]?.name || "",
              targetSignatures: TARGET_SIGNATURES,
              expiresDate: new Date(petition.expires)
                .toISOString()
                .split("T")[0],
            }}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {renderDescription()}
        {renderUpdates()}
        {renderResponse()}
      </div>
    );
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${petition.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/p/${petition.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: petition.title,
          text: `Vote for ${petition.title} on PawPrints`,
          url,
        });
      } catch (error) {
        console.error("Error sharing", error);
      }
    } else {
      handleCopyLink();
    }
  };

  const PetitionSidebar = ({ mobile = false }: { mobile?: boolean }) => {
    const content = (
      <div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Status
            </h4>
            <div className="flex items-center gap-1">
              {mobile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-3 w-3" />
                  Share
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs gap-2"
                onClick={handleCopyLink}
                title="Copy Link"
              >
                <LinkIcon className="h-3 w-3" />
                Copy link
              </Button>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${statusInfo.badge} text-base px-3 py-1`}
          >
            {statusInfo.text}
          </Badge>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-4">
            Signatures
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-bold">{petition.signatures}</span>
              <span className="text-muted-foreground">
                of {TARGET_SIGNATURES} needed
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {!mobile && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 mt-4">
              Timeline
            </h4>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-between h-auto py-1 px-0 text-sm font-normal hover:bg-transparent hover:underline"
                onClick={() => scrollToSection("description")}
              >
                <div className="flex items-center gap-2">
                  <PenToolIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Original Petition</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(petition.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </Button>

              {petition.response && (
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-1 px-0 text-sm font-normal text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-transparent hover:underline"
                  onClick={() => scrollToSection("response")}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="h-4 w-4" />
                    <span>Official Response</span>
                  </div>
                  <span className="text-xs text-green-600/80 dark:text-green-400/80 font-mono">
                    {new Date(petition.response.created_at).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </span>
                </Button>
              )}

              {petition.updates &&
                petition.updates.map((update) => (
                  <Button
                    key={update.id}
                    variant="ghost"
                    className="w-full justify-between h-auto py-1 px-0 text-sm font-normal text-foreground hover:text-foreground hover:bg-transparent hover:underline"
                    onClick={() => scrollToSection("updates")}
                  >
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground" />
                      <span>Update</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(update.created_at).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </span>
                  </Button>
                ))}
            </div>
          </div>
        )}

        <Separator className={`mt-4 ${mobile ? "hidden" : ""}`} />

        <dl
          className={`text-sm mt-4 ${mobile ? "grid grid-cols-2 gap-4" : "space-y-4"}`}
        >
          <div>
            <dt className="text-xs font-mono uppercase text-muted-foreground mb-1">
              Author
            </dt>
            <dd className="font-medium">{petition.author}</dd>
          </div>
          <div>
            <dt className="text-xs font-mono uppercase text-muted-foreground mb-1">
              Created
            </dt>
            <dd>
              {new Date(petition.created_at).toLocaleDateString(undefined, {
                weekday: mobile ? "short" : "long",
                year: "numeric",
                month: mobile ? "short" : "long",
                day: "numeric",
              })}
            </dd>
          </div>
          <div className={mobile ? "col-span-2" : ""}>
            <dt className="text-xs font-mono uppercase text-muted-foreground mb-1">
              Expires
            </dt>
            <dd>
              {new Date(petition.expires).toLocaleDateString(undefined, {
                weekday: mobile ? "short" : "long",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </dd>
          </div>
        </dl>

        <div className={`mt-auto ${mobile ? "pt-4" : "pt-6"}`}>
          {isReviewMode ? (
            <div className="space-y-2">
              <Button
                onClick={() => onApprove?.(petition)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2Icon className="mr-2 h-4 w-4" />
                Approve & Publish
              </Button>
              <Button
                onClick={() => onReject?.(petition)}
                variant="destructive"
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          ) : petition.response || new Date(petition.expires) < new Date() ? (
            <Button disabled className="w-full">
              {petition.response
                ? "Signing Closed (Responded)"
                : "Signing Closed (Expired)"}
            </Button>
          ) : (
            <div>
              {!user ? (
                <Button disabled variant="secondary" className="w-full">
                  Login to Sign
                </Button>
              ) : (
                <div className="space-y-4">
                  {(isAuthor || isAdmin) && (
                    <div className="space-y-2">
                      {petition.status === PetitionStatus.New && (
                        <div>
                          <Button
                            onClick={handlePublish}
                            disabled={isLoadingSign || isEditing}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isLoadingSign && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Submit for Review
                          </Button>
                          {!isEditing && (
                            <Button
                              onClick={() => setIsEditing(true)}
                              disabled={isLoadingSign}
                              variant="outline"
                              className="w-full mt-2"
                            >
                              Edit Petition
                            </Button>
                          )}
                        </div>
                      )}

                      {petition.status === PetitionStatus.NeedsReview && (
                        <div>
                          <Button
                            disabled
                            variant="secondary"
                            className="w-full bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          >
                            Under Review
                          </Button>
                          {isAdmin && !isEditing && (
                            <Button
                              onClick={() => setIsEditing(true)}
                              disabled={isLoadingSign}
                              variant="outline"
                              className="w-full mt-2"
                            >
                              Edit Petition (Admin)
                            </Button>
                          )}
                        </div>
                      )}

                      {petition.status === PetitionStatus.Published && (
                        <div>
                          <Button
                            disabled
                            variant="secondary"
                            className="w-full bg-green-100 text-green-800 hover:bg-green-100"
                          >
                            Published
                          </Button>
                          {isAdmin && !isEditing && (
                            <Button
                              onClick={() => setIsEditing(true)}
                              disabled={isLoadingSign}
                              variant="outline"
                              className="w-full mt-2"
                            >
                              Edit Petition (Admin)
                            </Button>
                          )}
                        </div>
                      )}

                      {petition.status === PetitionStatus.Removed && (
                        <Button
                          disabled
                          variant="destructive"
                          className="w-full"
                        >
                          Removed
                        </Button>
                      )}
                    </div>
                  )}

                  {!isAuthor && (
                    <Button
                      onClick={handleSign}
                      disabled={isLoadingSign}
                      variant={isSigned ? "destructive" : "default"}
                      className="w-full"
                    >
                      {isLoadingSign && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isSigned ? "Unsign Petition" : "Sign Petition"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );

    if (mobile) {
      return <div className="flex flex-col gap-4 w-full">{content}</div>;
    }

    return (
      <ScrollArea className="w-80 border-l bg-muted/10 h-full">
        <div className="flex flex-col gap-4 p-4 min-h-full">{content}</div>
      </ScrollArea>
    );
  };

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[85vw] w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b flex-shrink-0 pr-12">
            <DialogTitle className="text-2xl font-bold text-foreground mb-2">
              {petition.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Petition by {petition.author}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden flex-row">
            <ScrollArea className="flex-1">
              <div className="p-6">{renderPetitionBody()}</div>
            </ScrollArea>
            <PetitionSidebar />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader className="text-left border-b">
          <DrawerTitle className="text-xl font-bold">
            {petition.title}
          </DrawerTitle>
          <DrawerDescription>Petition by {petition.author}</DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full overflow-y-auto">
            <div className="py-6 px-4">
              <PetitionSidebar mobile />
            </div>
            <div className="pb-8">
              {(petition.updates?.length > 0 || petition.response) && (
                <Separator className="mb-6" />
              )}
              <div className="px-4">{renderDescription()}</div>
              <div className="my-6 px-4 space-y-6">
                {renderUpdates()}
                {renderResponse()}
              </div>
            </div>
          </ScrollArea>
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PetitionModal;
