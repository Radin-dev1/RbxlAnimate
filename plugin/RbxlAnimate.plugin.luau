--!strict
-- rbxlAnimate Studio plugin bootstrap (Phase 2)
-- Website Phase 1 ships first; wire HTTP to /api/generate and apply KeyframeSequences here.

local toolbar = plugin:CreateToolbar("rbxlAnimate")
local button = toolbar:CreateButton("Open", "Open rbxlAnimate", "")

button.Click:Connect(function()
	print("[rbxlAnimate] Connect Roblox auth, then sync animations from the web studio.")
end)
