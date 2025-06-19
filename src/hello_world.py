__all__ = ["addTextLayer"]

def addTextLayer():
    layer = guisystem.track.addNewLayer(TextModule, trackTime(), 60, 'Text - Dynamic')
    layer.findSequence('text').sequence.setString(0, "hellowworld")
    return True