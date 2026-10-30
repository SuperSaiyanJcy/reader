import AppKit
import Foundation

// 原创文档图标：仅使用系统绘图库生成，构建时无需额外图像依赖。
let output = CommandLine.arguments.dropFirst().first ?? "resources"
let manager = FileManager.default
let iconset = "\(output)/icon.iconset"
try manager.createDirectory(atPath: iconset, withIntermediateDirectories: true)
for size in [16, 32, 64, 128, 256, 512, 1024] {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()
    let scale = CGFloat(size) / 1024
    NSGraphicsContext.current!.imageInterpolation = .high
    let transform = NSAffineTransform()
    transform.scale(by: scale)
    transform.concat()
    NSColor(calibratedRed: 0.15, green: 0.32, blue: 0.56, alpha: 1).setFill()
    NSBezierPath(roundedRect: NSRect(x: 72, y: 72, width: 880, height: 880), xRadius: 190, yRadius: 190).fill()
    NSColor(calibratedRed: 0.99, green: 0.99, blue: 1, alpha: 1).setFill()
    NSBezierPath(roundedRect: NSRect(x: 305, y: 195, width: 420, height: 650), xRadius: 32, yRadius: 32).fill()
    NSColor(calibratedRed: 0.72, green: 0.81, blue: 0.92, alpha: 1).setFill()
    for y in [700, 620, 540, 460] {
        NSBezierPath(roundedRect: NSRect(x: 373, y: y, width: 280, height: 18), xRadius: 8, yRadius: 8).fill()
    }
    NSColor(calibratedRed: 0.23, green: 0.47, blue: 0.73, alpha: 1).setFill()
    NSBezierPath(roundedRect: NSRect(x: 215, y: 262, width: 285, height: 285), xRadius: 32, yRadius: 32).fill()
    let attributes: [NSAttributedString.Key: Any] = [.font: NSFont.systemFont(ofSize: 180, weight: .semibold), .foregroundColor: NSColor.white]
    ("R" as NSString).draw(at: NSPoint(x: 292, y: 292), withAttributes: attributes)
    image.unlockFocus()
    let bitmap = NSBitmapImageRep(data: image.tiffRepresentation!)!
    let png = bitmap.representation(using: .png, properties: [:])!
    let name: String
    if size == 1024 { name = "icon_512x512@2x.png" }
    else { name = "icon_\(size)x\(size).png" }
    try png.write(to: URL(fileURLWithPath: "\(iconset)/\(name)"))
    if size == 256 { try png.write(to: URL(fileURLWithPath: "\(output)/icon.png")) }
}
for size in [16, 32, 128, 256] {
    let source = "\(iconset)/icon_\(size * 2)x\(size * 2).png"
    let dest = "\(iconset)/icon_\(size)x\(size)@2x.png"
    if manager.fileExists(atPath: dest) { try manager.removeItem(atPath: dest) }
    try manager.copyItem(atPath: source, toPath: dest)
}
