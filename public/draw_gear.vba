' =====================================================================
' SOLIDWORKS PARAMETRIC GEAR DESIGN MACRO ENGINE (draw_gear.vba)
' Tooth Cutout Mirroring & Circular Pattern Replication Subroutine
' =====================================================================
Dim swApp As Object
Dim swModel As Object
Dim swFeatureMgr As Object

Sub Main()
    Set swApp = Application.SldWorks
    Set swModel = swApp.ActiveDoc
    
    If swModel Is Nothing Then
        MsgBox "Critical Error: Active model template container not detected.", vbCritical, "SolidWorks API Error"
        Exit Sub
    End If
    
    Set swFeatureMgr = swModel.FeatureManager
    
    Dim teethCount As Long
    Dim radialSpacingAngle As Double
    teethCount = 24
    radialSpacingAngle = (2 * 3.14159265358979) / teethCount
    
    Dim status As Boolean
    status = swModel.Extension.SelectByID2("Tooth_Cutout", "BODYFEATURE", 0, 0, 0, False, 4, Nothing, 0)
    status = swModel.Extension.SelectByID2("Axis1", "AXIS", 0, 0, 0, True, 1, Nothing, 0)
    
    Dim swFeature As Object
    Set swFeature = swFeatureMgr.FeatureCircularPattern5(teethCount, radialSpacingAngle, True, "CircularPattern1", False, False, False)
    
    If Not swFeature Is Nothing Then
        Debug.Print "[SUCCESS] Parametric gear layout finalized: " & teethCount & " teeth cutouts arrayed."
    Else
        Debug.Print "[ERROR] Circular array execution failed. Check Axis1 alignment."
    End If
End Sub
