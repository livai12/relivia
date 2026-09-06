import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const patientId = params.id;

    // Verify ownership
    const { data: patient } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .eq("caregiver_id", user.id)
      .single();
    if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Fetch last 30 days of health data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().slice(0, 10);

    const { data: healthData } = await supabase
      .from("health_data")
      .select("*")
      .eq("patient_id", patientId)
      .gte("recorded_at", fromDate)
      .order("recorded_at", { ascending: false });

    // Fetch baselines
    const { data: baselines } = await supabase
      .from("baselines")
      .select("*")
      .eq("patient_id", patientId);

    const baselineMap: Record<string, { value: number; min: number | null; max: number | null }> = {};
    for (const b of baselines ?? []) {
      baselineMap[b.metric] = {
        value: b.baseline_value,
        min: b.baseline_min,
        max: b.baseline_max,
      };
    }

    // Today's data
    const today = new Date().toISOString().slice(0, 10);
    const todayData = (healthData ?? []).filter((h) => h.recorded_at === today);

    const todayMap: Record<string, { value: number; unit: string }> = {};
    for (const d of todayData) {
      todayMap[d.data_type] = { value: d.value, unit: d.unit };
    }

    // Compute deviation from baseline
    const metrics = ["sleep_hours", "steps", "heart_rate"];
    const overview = metrics.map((metric) => {
      const today_val = todayMap[metric];
      const baseline = baselineMap[metric];

      let changePercent: number | null = null;
      if (today_val && baseline) {
        changePercent =
          Math.round(((today_val.value - baseline.value) / baseline.value) * 1000) / 10;
      }

      return {
        metric,
        today_value: today_val?.value ?? null,
        today_unit: today_val?.unit ?? null,
        baseline_value: baseline?.value ?? null,
        change_percent: changePercent,
        has_data: !!today_val,
      };
    });

    return NextResponse.json({
      patient_id: patientId,
      date: today,
      overview,
      history: healthData ?? [],
    });
  } catch (err) {
    console.error("[patient/health]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
