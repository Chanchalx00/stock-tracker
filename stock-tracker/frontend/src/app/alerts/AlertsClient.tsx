"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import FadeIn from "@/components/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/Stagger";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

import {
  IconAlerts,
  IconBellOff,
  IconCheck,
  IconTrendingUp,
  IconTrendingDown,
  IconTrash,
  IconBellAdd,
  IconBellRing,
  IconShield,
} from "@/lib/icons";

import { useAlerts } from "@/hooks/useAlerts";
import { useSymbolValidation } from "@/hooks/useSymbolValidation";
import { useToast } from "@/hooks/useToast";
import { getSocket } from "@/lib/socket";

function generateSuggestions(
  currentPrice: number,
  condition: string,
): number[] {
  if (!currentPrice || currentPrice <= 0) return [];
  const round = (v: number): number => {
    if (currentPrice < 5) return Math.round(v * 10) / 10;
    if (currentPrice < 50) return Math.round(v * 2) / 2;
    if (currentPrice < 200) return Math.round(v);
    if (currentPrice < 1000) return Math.round(v / 5) * 5;
    return Math.round(v / 10) * 10;
  };
  const pcts = [0.02, 0.05, 0.1, 0.15, 0.2];
  const suggestions = pcts.map((pct) => {
    const offset = currentPrice * pct;
    const raw =
      condition === "GREATER_THAN"
        ? currentPrice + offset
        : currentPrice - offset;
    return round(raw);
  });
  return [...new Set(suggestions)].filter((v) => v > 0);
}

const defaultForm = { symbol: "", condition: "GREATER_THAN", targetPrice: "" };

function AlertsContent() {
  const searchParams = useSearchParams();
  const { active, triggered, loading, create, remove, refetch } = useAlerts();
  const {
    validated,
    validating,
    symError,
    validate,
    reset: resetSym,
  } = useSymbolValidation();
  const { toast, success, error: toastError } = useToast();

  const [form, setForm] = useState({
    ...defaultForm,
    symbol: searchParams.get("symbol") || "",
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const validateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = validated
    ? generateSuggestions(validated.currentPrice, form.condition)
    : [];

  useEffect(() => {
    const sym = searchParams.get("symbol");
    if (sym) validate(sym);

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission("unsupported");
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAlertTriggered = (triggeredAlert: any) => {
      refetch();
      const condText = triggeredAlert.condition === "GREATER_THAN" ? "rises ABOVE" : "drops BELOW";
      const bodyMsg = `${triggeredAlert.symbol} price ${condText} target ₹${triggeredAlert.targetPrice}! Triggered @ ₹${triggeredAlert.triggeredPrice}`;

      success(`Alert Triggered: ${triggeredAlert.symbol}`);

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(` Price Alert: ${triggeredAlert.symbol}`, {
            body: bodyMsg,
            icon: "/favicon.ico",
            tag: `alert-${triggeredAlert._id}`,
          });
        } catch {
        }
      }
    };

    socket.on("alert:triggered", handleAlertTriggered);

    return () => {
      socket.off("alert:triggered", handleAlertTriggered);
    };
  }, [refetch, success]);

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toastError("Windows desktop notifications are not supported in your browser.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        success("Windows desktop notifications enabled!");
        new Notification("Windows Notifications Active", {
          body: "You will now receive native Windows OS desktop alerts when target prices are hit.",
          icon: "/favicon.ico",
        });
      } else {
        toastError("Desktop notification permission was denied.");
      }
    } catch {
      toastError("Could not request notification permission.");
    }
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, symbol: val }));
    if (validateTimer.current) clearTimeout(validateTimer.current);
    if (val.trim().length >= 1) {
      validateTimer.current = setTimeout(() => validate(val), 600);
    } else {
      resetSym();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.symbol.trim()) return setFormError("Symbol is required.");
    if (!form.targetPrice) return setFormError("Target price is required.");
    if (!validated) return setFormError("Please enter a valid symbol first.");
    if (+form.targetPrice <= 0)
      return setFormError("Target price must be greater than 0.");

    setCreating(true);
    try {
      await create({
        symbol: form.symbol.trim().toUpperCase(),
        condition: form.condition as "GREATER_THAN" | "LESS_THAN",
        targetPrice: +form.targetPrice,
      });
      setForm({ ...defaultForm });
      resetSym();
      success("Alert created!");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create alert.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      success("Alert deleted.");
    } catch {
      toastError("Failed to delete.");
    }
  };

  const allAlerts = [...active, ...triggered];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <FadeIn>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <IconAlerts
                  size={22}
                  className="text-emerald-400"
                  aria-hidden="true"
                />
                <h1 className="text-2xl font-bold text-white">Price Alerts</h1>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Real-time price monitoring with Windows OS desktop notifications
              </p>
            </div>

            <div>
              {notifPermission === "granted" ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <IconShield size={14} />
                  <span>Windows Desktop Notifications Active</span>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<IconBellRing size={14} />}
                  onClick={requestNotificationPermission}
                >
                  Enable Windows OS Desktop Alerts
                </Button>
              )}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-white mb-4">
              Create New Alert
            </h2>

            {formError && (
              <AlertBanner variant="error" className="mb-4">
                {formError}
              </AlertBanner>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <Input
                  label="Stock Symbol"
                  required
                  placeholder="e.g. RELIANCE, TCS, INFY"
                  value={form.symbol}
                  onChange={handleSymbolChange}
                  onBlur={() => validate(form.symbol)}
                  error={symError || undefined}
                  success={!!validated && !symError}
                  rightAddon={
                    validating ? (
                      <Spinner size="xs" aria-hidden />
                    ) : validated && !symError ? (
                      <IconCheck size={14} className="text-emerald-400" />
                    ) : undefined
                  }
                />
                {validated && !symError && (
                  <div className="mt-1.5 flex items-center gap-2 text-xs flex-wrap">
                    <span className="text-emerald-400 font-medium">
                      {validated.symbol}
                    </span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-400">
                      Current:{" "}
                      <span className="text-white font-semibold">
                        ₹{validated.currentPrice.toFixed(2)}
                      </span>
                    </span>
                    <span
                      className={`font-medium flex items-center gap-1 ${validated.percentChange >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {validated.percentChange >= 0 ? (
                        <IconTrendingUp size={12} />
                      ) : (
                        <IconTrendingDown size={12} />
                      )}
                      {Math.abs(validated.percentChange).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>

              <Select
                label="Condition"
                required
                value={form.condition}
                onChange={(e) =>
                  setForm((f) => ({ ...f, condition: e.target.value }))
                }
                options={[
                  { value: "GREATER_THAN", label: "Price rises ABOVE target" },
                  { value: "LESS_THAN", label: "Price drops BELOW target" },
                ]}
              />
            </div>

            <div className="mb-4">
              <Input
                label="Target Price (₹)"
                required
                type="number"
                placeholder="Enter target price"
                value={form.targetPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetPrice: e.target.value }))
                }
                min="0.01"
                step="0.01"
              />

              {validated && suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    Suggested targets
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => {
                      const pct =
                        ((s - validated.currentPrice) /
                          validated.currentPrice) *
                        100;
                      const isActive = form.targetPrice === String(s);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, targetPrice: String(s) }))
                          }
                          aria-pressed={isActive}
                          className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs transition-all ${
                            isActive
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                              : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                          }`}
                        >
                          <span className="font-bold text-sm text-white">
                            ₹{s.toFixed(2)}
                          </span>
                          <span
                            className={
                              isActive ? "text-emerald-400" : "text-gray-500"
                            }
                          >
                            {form.condition === "GREATER_THAN" ? "+" : "-"}
                            {Math.abs(pct).toFixed(0)}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Button
              fullWidth
              loading={creating}
              disabled={!validated || !!symError}
              leftIcon={<IconBellAdd size={14} />}
              onClick={handleCreate}
            >
              Set Price Alert
            </Button>

            {!validated && !symError && !validating && (
              <p className="text-center text-xs text-gray-600 mt-2">
                Enter a valid symbol above to enable the alert button
              </p>
            )}
          </div>
        </FadeIn>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" label="Loading alerts…" />
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                  Active · {active.length}
                </h3>
                <StaggerContainer className="space-y-2">
                  {active.map((a) => (
                    <StaggerItem key={a._id}>
                      <AlertRow alert={a} onDelete={handleDelete} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            )}

            {triggered.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                  Triggered · {triggered.length}
                </h3>
                <StaggerContainer className="space-y-2">
                  {triggered.map((a) => (
                    <StaggerItem key={a._id}>
                      <AlertRow alert={a} onDelete={handleDelete} triggered />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            )}

            {allAlerts.length === 0 && (
              <FadeIn>
                <EmptyState
                  Icon={IconBellOff}
                  title="No alerts yet"
                  description="Create your first alert above"
                />
              </FadeIn>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}

function AlertRow({
  alert,
  onDelete,
  triggered = false,
}: {
  alert: {
    _id: string;
    symbol: string;
    condition: string;
    targetPrice: number;
    isTriggered: boolean;
    triggeredAt?: string;
    triggeredPrice?: number;
    createdAt: string;
  };
  onDelete: (id: string) => void;
  triggered?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${
        triggered
          ? "bg-emerald-500/5 border-emerald-500/25"
          : "bg-gray-900 border-gray-800 hover:border-gray-700"
      }`}
    >
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white text-sm">{alert.symbol}</span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {alert.condition === "GREATER_THAN" ? (
              <IconTrendingUp size={12} className="text-emerald-400" />
            ) : (
              <IconTrendingDown size={12} className="text-red-400" />
            )}
            <span>
              {alert.condition === "GREATER_THAN" ? "above" : "below"}{" "}
              <span className="text-white font-medium">
                ₹
                {alert.targetPrice != null
                  ? alert.targetPrice.toLocaleString("en-IN")
                  : "—"}
              </span>
            </span>
          </span>
          {triggered ? (
            <Badge variant="emerald">
              <IconCheck size={10} />
              Triggered @ ₹
              {alert.triggeredPrice != null
                ? alert.triggeredPrice.toLocaleString("en-IN")
                : "—"}
            </Badge>
          ) : (
            <Badge variant="blue">Watching</Badge>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-0.5">
          Set{" "}
          {new Date(alert.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {alert.triggeredAt && (
            <span>
              {" "}
              · Triggered{" "}
              {new Date(alert.triggeredAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </p>
      </div>
      <button
        onClick={() => onDelete(alert._id)}
        aria-label={`Delete alert for ${alert.symbol}`}
        className="ml-4 shrink-0 text-red-400/70 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
      >
        <IconTrash size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function AlertsClient() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <Suspense
          fallback={
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          }
        >
          <AlertsContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
