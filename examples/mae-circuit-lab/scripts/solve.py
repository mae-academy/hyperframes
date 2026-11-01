"""Exact mesh-analysis solver for the MAE Circuit Lab composition.

Everything is computed with fractions.Fraction (units: kOhm, V, mA, mW), so the elimination
steps, KCL residuals and the power balance are exact. Nothing here is hard-coded to one set of values.

Mesh currents are clockwise: I1 = left mesh (V1,R1,R2,V3), I2 = top-right mesh (R3,V2,R4,R2),
I3 = bottom-right mesh (R5,V3,R4).
"""
from fractions import Fraction as F


def solve_mesh(R, V):
    R1, R2, R3, R4, R5 = (F(x) for x in R)
    V1, V2, V3 = (F(x) for x in V)
    A = [[R1 + R2, -R2, F(0)],
         [-R2, R2 + R3 + R4, -R4],
         [F(0), -R4, R4 + R5]]
    b = [V1 - V3, -V2, V3]
    A0 = [row[:] for row in A]
    b0 = b[:]

    # ---- forward elimination (rows are updated in place; each step is recorded) ----
    steps = []
    for tgt in (1, 2):
        piv = tgt - 1
        m = -A[tgt][piv] / A[piv][piv]          # R_tgt <- R_tgt + m * R_piv
        before = (A[tgt][:], b[tgt])
        for c in range(3):
            A[tgt][c] += m * A[piv][c]
        b[tgt] += m * b[piv]
        steps.append(dict(kind="fwd", pivot=piv, target=tgt, m=m,
                          before=before, after=(A[tgt][:], b[tgt]),
                          piv_row=(A[piv][:], b[piv])))
    # ---- back substitution ----
    I = [None] * 3
    for r in (2, 1, 0):
        rhs = b[r] - sum(A[r][c] * I[c] for c in range(r + 1, 3))
        I[r] = rhs / A[r][r]
        steps.append(dict(kind="back", pivot=r, row=(A[r][:], b[r]), value=I[r]))
    I1, I2, I3 = I

    # ---- verification: residual of the original system ----
    for r in range(3):
        assert sum(A0[r][c] * I[c] for c in range(3)) == b0[r], "mesh equations not satisfied"

    # ---- branch currents (reference directions) ----
    #   R1: TL->N1, R3: N1->TR, R2: N1->N3, R4: N3->N2, R5: N2->GND
    #   V1: current leaving + terminal (GND->TL), V2: current entering + terminal (TR->N2),
    #   V3: current leaving + terminal (GND->N3)
    br = {"R1": I1, "R3": I2, "R2": I1 - I2, "R4": I3 - I2, "R5": I3,
          "V1": I1, "V2": I2, "V3": I3 - I1}
    Rv = dict(R1=R1, R2=R2, R3=R3, R4=R4, R5=R5)
    Vv = dict(V1=V1, V2=V2, V3=V3)
    drop = {k: Rv[k] * br[k] for k in Rv}           # V = R*I (kOhm*mA = V)

    # ---- node voltages (GND = 0) ----
    vTL = V1
    vN1 = vTL - drop["R1"]
    vTR = vN1 - drop["R3"]
    vN2 = vTR - V2
    vN3 = V3
    node_v = dict(TL=vTL, N1=vN1, TR=vTR, N2=vN2, N3=vN3, GND=F(0))
    assert vN1 - drop["R2"] == vN3, "KVL around R2/V3"
    assert vN3 - drop["R4"] == vN2, "KVL around R4"
    assert vN2 == drop["R5"], "KVL around R5"

    # ---- KCL at N1, N2, N3: sum(in) == sum(out) ----
    kcl = {
        "N1": dict(inn=[("R1", br["R1"])], out=[("R3", br["R3"]), ("R2", br["R2"])]),
        "N2": dict(inn=[("V2", br["V2"]), ("R4", br["R4"])], out=[("R5", br["R5"])]),
        "N3": dict(inn=[("R2", br["R2"]), ("V3", br["V3"])], out=[("R4", br["R4"])]),
    }
    for n, d in kcl.items():
        d["sum_in"] = sum(x for _, x in d["inn"])
        d["sum_out"] = sum(x for _, x in d["out"])
        assert d["sum_in"] == d["sum_out"], f"KCL fails at {n}"

    # ---- power: delivered by sources (V * current leaving +) vs dissipated ----
    p_src = {"V1": V1 * br["V1"], "V2": -V2 * br["V2"], "V3": V3 * br["V3"]}
    p_res = {k: Rv[k] * br[k] ** 2 for k in Rv}
    assert sum(p_src.values()) == sum(p_res.values()), "power balance fails"

    return dict(A0=A0, b0=b0, A=A, b=b, steps=steps, I=I, branch=br, drop=drop,
                node_v=node_v, kcl=kcl, p_src=p_src, p_res=p_res,
                P_src=sum(p_src.values()), P_res=sum(p_res.values()))


if __name__ == "__main__":  # sanity: the defaults quoted in the brief
    d = solve_mesh([1] * 5, [12] * 3)
    assert d["I"] == [F(-3, 2), F(-3), F(9, 2)], d["I"]
    print("defaults OK:", [str(x) for x in d["I"]])
    import sys
    d = solve_mesh([2, 2, 3, 4, 1], [5, 16, 13])
    print("this video:", [str(x) for x in d["I"]], "P =", d["P_src"], d["P_res"])
