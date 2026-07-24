--!strict
--[[
	rbxlAnimate Studio Plugin
	Import .rbxlAnimate.json KeyframeSequences onto a selected R15 rig.

	Install:
	1. In Studio → Plugins → Plugins Folder
	2. Drop this file (or the plugin folder) there, restart Studio
	3. Select an R15 model/character → open rbxlAnimate → Paste JSON or Import file
]]

local HttpService = game:GetService("HttpService")
local Selection = game:GetService("Selection")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local toolbar = plugin:CreateToolbar("rbxlAnimate")
local openButton = toolbar:CreateButton(
	"Importer",
	"Import rbxlAnimate JSON onto selected R15",
	"rbxassetid://6031075931"
)
openButton.ClickableWhenViewportHidden = true

local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false,
	false,
	420,
	520,
	360,
	400
)
local widget = plugin:CreateDockWidgetPluginGui("rbxlAnimateImporter", widgetInfo)
widget.Title = "rbxlAnimate Importer"
widget.Name = "rbxlAnimateImporter"

local root = Instance.new("Frame")
root.BackgroundColor3 = Color3.fromRGB(18, 18, 18)
root.BorderSizePixel = 0
root.Size = UDim2.fromScale(1, 1)
root.Parent = widget

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0, 12)
padding.PaddingBottom = UDim.new(0, 12)
padding.PaddingLeft = UDim.new(0, 12)
padding.PaddingRight = UDim.new(0, 12)
padding.Parent = root

local list = Instance.new("UIListLayout")
list.Padding = UDim.new(0, 8)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = root

local function makeLabel(text: string, order: number, bold: boolean?): TextLabel
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Font = if bold then Enum.Font.GothamBold else Enum.Font.Gotham
	label.TextSize = if bold then 16 else 13
	label.TextColor3 = Color3.fromRGB(240, 240, 240)
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.TextYAlignment = Enum.TextYAlignment.Top
	label.TextWrapped = true
	label.AutomaticSize = Enum.AutomaticSize.Y
	label.Size = UDim2.new(1, 0, 0, 0)
	label.Text = text
	label.LayoutOrder = order
	label.Parent = root
	return label
end

local function makeButton(text: string, order: number, color: Color3): TextButton
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.new(1, 0, 0, 36)
	btn.BackgroundColor3 = color
	btn.BorderSizePixel = 0
	btn.Font = Enum.Font.GothamBold
	btn.TextSize = 14
	btn.TextColor3 = Color3.new(1, 1, 1)
	btn.Text = text
	btn.LayoutOrder = order
	btn.AutoButtonColor = true
	btn.Parent = root
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 8)
	corner.Parent = btn
	return btn
end

makeLabel("rbxlAnimate", 1, true)
makeLabel(
	"1) Select an R15 character (Model with Humanoid + Motor6Ds)\n2) Paste export JSON below OR Import a .json file\n3) Click Apply to AnimSaves",
	2,
	false
)

local status = makeLabel("Ready.", 3, false)
status.TextColor3 = Color3.fromRGB(180, 180, 180)

local input = Instance.new("TextBox")
input.Size = UDim2.new(1, 0, 0, 220)
input.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
input.BorderSizePixel = 0
input.ClearTextOnFocus = false
input.MultiLine = true
input.TextXAlignment = Enum.TextXAlignment.Left
input.TextYAlignment = Enum.TextYAlignment.Top
input.Font = Enum.Font.Code
input.TextSize = 12
input.TextColor3 = Color3.fromRGB(230, 230, 230)
input.PlaceholderText = "Paste rbxlAnimate JSON here…"
input.Text = ""
input.LayoutOrder = 4
input.Parent = root
local inputCorner = Instance.new("UICorner")
inputCorner.CornerRadius = UDim.new(0, 8)
inputCorner.Parent = input
local inputPad = Instance.new("UIPadding")
inputPad.PaddingTop = UDim.new(0, 8)
inputPad.PaddingLeft = UDim.new(0, 8)
inputPad.PaddingRight = UDim.new(0, 8)
inputPad.Parent = input

local function findHumanoidRoot(inst: Instance): Model?
	if inst:IsA("Model") and inst:FindFirstChildOfClass("Humanoid") then
		return inst
	end
	local model = inst:FindFirstAncestorOfClass("Model")
	if model and model:FindFirstChildOfClass("Humanoid") then
		return model
	end
	return nil
end

local function degToCF(x: number, y: number, z: number): CFrame
	return CFrame.Angles(math.rad(x), math.rad(y), math.rad(z))
end

local function applyImport(jsonText: string)
	local selected = Selection:Get()
	if #selected == 0 then
		status.Text = "Select an R15 character first."
		status.TextColor3 = Color3.fromRGB(255, 120, 120)
		return
	end
	local character = findHumanoidRoot(selected[1])
	if not character then
		status.Text = "Selection must be (or be inside) an R15 Model with a Humanoid."
		status.TextColor3 = Color3.fromRGB(255, 120, 120)
		return
	end

	local ok, data = pcall(function()
		return HttpService:JSONDecode(jsonText)
	end)
	if not ok or typeof(data) ~= "table" then
		status.Text = "Invalid JSON. Export again from rbxlAnimate web."
		status.TextColor3 = Color3.fromRGB(255, 120, 120)
		return
	end
	if data.format ~= "rbxlAnimate.keyframesequence.v1" and data.format ~= "rbxlanimate.keyframesequence.v1" then
		status.Text = "Unrecognized format. Expected rbxlAnimate.keyframesequence.v1"
		status.TextColor3 = Color3.fromRGB(255, 120, 120)
		return
	end

	local joints = data.joints
	if typeof(joints) ~= "table" or #joints == 0 then
		status.Text = "JSON has no keyframes."
		status.TextColor3 = Color3.fromRGB(255, 120, 120)
		return
	end

	-- R15 pose tree (Animation Editor expects nested Poses)
	local POSE_PARENT: { [string]: string? } = {
		HumanoidRootPart = nil,
		LowerTorso = "HumanoidRootPart",
		UpperTorso = "LowerTorso",
		Head = "UpperTorso",
		LeftUpperArm = "UpperTorso",
		LeftLowerArm = "LeftUpperArm",
		LeftHand = "LeftLowerArm",
		RightUpperArm = "UpperTorso",
		RightLowerArm = "RightUpperArm",
		RightHand = "RightLowerArm",
		LeftUpperLeg = "LowerTorso",
		LeftLowerLeg = "LeftUpperLeg",
		LeftFoot = "LeftLowerLeg",
		RightUpperLeg = "LowerTorso",
		RightLowerLeg = "RightUpperLeg",
		RightFoot = "RightLowerLeg",
	}

	local function partNameForJoint(jointName: string): string
		if jointName == "Root" then
			return "HumanoidRootPart"
		end
		return jointName
	end

	local function readCFrame(poseData: any): CFrame
		local od = poseData.orientationDegrees
		local x, y, z = 0, 0, 0
		if typeof(od) == "table" then
			x = tonumber(od.x) or 0
			y = tonumber(od.y) or 0
			z = tonumber(od.z) or 0
		end
		local pos = poseData.position
		local px, py, pz = 0, 0, 0
		if typeof(pos) == "table" then
			px = tonumber(pos.x) or 0
			py = tonumber(pos.y) or 0
			pz = tonumber(pos.z) or 0
		end
		-- Scale hop/flip translation into studs (web preview uses ~0.55)
		return degToCF(x, y, z) + Vector3.new(px * 0.55, py * 0.55, pz * 0.55)
	end

	ChangeHistoryService:SetWaypoint("Before rbxlAnimate import")

	local animSaves = character:FindFirstChild("AnimSaves")
	if not animSaves then
		animSaves = Instance.new("Folder")
		animSaves.Name = "AnimSaves"
		animSaves.Parent = character
	end

	local seqName = if typeof(data.name) == "string" and data.name ~= "" then data.name else "rbxlAnimate"
	local existing = animSaves:FindFirstChild(seqName)
	if existing then
		existing:Destroy()
	end

	local sequence = Instance.new("KeyframeSequence")
	sequence.Name = seqName
	sequence.Loop = data.looped == true
	sequence.Priority = Enum.AnimationPriority.Action
	sequence.Parent = animSaves

	local count = 0
	local frameCount = 0

	for _, frame in joints do
		if typeof(frame) == "table" and typeof(frame.time) == "number" and typeof(frame.poses) == "table" then
			local keyframe = Instance.new("Keyframe")
			keyframe.Time = frame.time
			keyframe.Parent = sequence
			frameCount += 1

			local byName: { [string]: Pose } = {}
			-- Ensure full R15 tree exists even if a joint is missing from JSON
			for partName in POSE_PARENT do
				local pose = Instance.new("Pose")
				pose.Name = partName
				pose.CFrame = CFrame.new()
				byName[partName] = pose
			end

			for _, poseData in frame.poses do
				if typeof(poseData) == "table" and typeof(poseData.joint) == "string" then
					local partName = partNameForJoint(poseData.joint)
					local pose = byName[partName]
					if pose then
						pose.CFrame = readCFrame(poseData)
						count += 1
					end
				end
			end

			for partName, pose in byName do
				local parentName = POSE_PARENT[partName]
				if parentName == nil then
					pose.Parent = keyframe
				else
					pose.Parent = byName[parentName]
				end
			end
		end
	end

	ChangeHistoryService:SetWaypoint("After rbxlAnimate import")
	Selection:Set({ sequence })
	status.Text = string.format(
		"Imported “%s” → %s.AnimSaves (%d frames, %d posed joints, %.2fs). Open Animation Editor → Load from AnimSaves.",
		seqName,
		character.Name,
		frameCount,
		count,
		tonumber(data.length) or 0
	)
	status.TextColor3 = Color3.fromRGB(120, 220, 140)
end

local applyBtn = makeButton("Apply to selected R15", 5, Color3.fromRGB(225, 6, 0))
applyBtn.MouseButton1Click:Connect(function()
	applyImport(input.Text)
end)

local importBtn = makeButton("Import .json file…", 6, Color3.fromRGB(40, 40, 40))
importBtn.MouseButton1Click:Connect(function()
	local ok, files = pcall(function()
		return plugin:PromptImportFile({ "json" }) :: any
	end)
	if not ok or not files then
		status.Text = "File picker unavailable — paste JSON instead."
		status.TextColor3 = Color3.fromRGB(255, 180, 100)
		return
	end
	-- PromptImportFile returns a File in modern Studio
	local file = files
	if typeof(file) == "Instance" or typeof(file) == "userdata" then
		local readOk, contents = pcall(function()
			return (file :: any):GetBinaryContents()
		end)
		if readOk and typeof(contents) == "string" then
			input.Text = contents
			applyImport(contents)
			return
		end
	end
	status.Text = "Could not read file. Paste JSON into the box."
	status.TextColor3 = Color3.fromRGB(255, 180, 100)
end)

local clearBtn = makeButton("Clear", 7, Color3.fromRGB(30, 30, 30))
clearBtn.MouseButton1Click:Connect(function()
	input.Text = ""
	status.Text = "Ready."
	status.TextColor3 = Color3.fromRGB(180, 180, 180)
end)

openButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)
