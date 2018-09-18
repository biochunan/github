import FilePatch from '../../../lib/models/patch/file-patch';
    assert.strictEqual(filePatch.getHunkAt(1), hunks[0]);

  it('adopts a buffer and layers from a prior FilePatch', function() {
    const oldFile = new File({path: 'a.txt', mode: '100755'});
    const newFile = new File({path: 'b.txt', mode: '100755'});

    const prevBuffer = new TextBuffer({text: '0000\n0001\n0002\n'});
    const prevLayers = buildLayers(prevBuffer);
    const prevHunks = [
      new Hunk({
        oldStartRow: 2, oldRowCount: 2, newStartRow: 2, newRowCount: 3,
        marker: markRange(prevLayers.hunk, 0, 2),
        regions: [
          new Unchanged(markRange(prevLayers.unchanged, 0)),
          new Addition(markRange(prevLayers.addition, 1)),
          new Unchanged(markRange(prevLayers.unchanged, 2)),
        ],
      }),
    ];
    const prevPatch = new Patch({status: 'modified', hunks: prevHunks, buffer: prevBuffer, layers: prevLayers});
    const prevFilePatch = new FilePatch(oldFile, newFile, prevPatch);

    const nextBuffer = new TextBuffer({text: '0000\n0001\n0002\n0003\n0004\n No newline at end of file'});
    const nextLayers = buildLayers(nextBuffer);
    const nextHunks = [
      new Hunk({
        oldStartRow: 2, oldRowCount: 2, newStartRow: 2, newRowCount: 3,
        marker: markRange(nextLayers.hunk, 0, 2),
        regions: [
          new Unchanged(markRange(nextLayers.unchanged, 0)),
          new Addition(markRange(nextLayers.addition, 1)),
          new Unchanged(markRange(nextLayers.unchanged, 2)),
        ],
      }),
      new Hunk({
        oldStartRow: 10, oldRowCount: 2, newStartRow: 11, newRowCount: 1,
        marker: markRange(nextLayers.hunk, 3, 5),
        regions: [
          new Unchanged(markRange(nextLayers.unchanged, 3)),
          new Deletion(markRange(nextLayers.deletion, 4)),
          new NoNewline(markRange(nextLayers.noNewline, 5)),
        ],
      }),
    ];
    const nextPatch = new Patch({status: 'modified', hunks: nextHunks, buffer: nextBuffer, layers: nextLayers});
    const nextFilePatch = new FilePatch(oldFile, newFile, nextPatch);

    nextFilePatch.adoptBufferFrom(prevFilePatch);

    assert.strictEqual(nextFilePatch.getBuffer(), prevBuffer);
    assert.strictEqual(nextFilePatch.getHunkLayer(), prevLayers.hunk);
    assert.strictEqual(nextFilePatch.getUnchangedLayer(), prevLayers.unchanged);
    assert.strictEqual(nextFilePatch.getAdditionLayer(), prevLayers.addition);
    assert.strictEqual(nextFilePatch.getDeletionLayer(), prevLayers.deletion);
    assert.strictEqual(nextFilePatch.getNoNewlineLayer(), prevLayers.noNewline);

    const rangesFrom = layer => layer.getMarkers().map(marker => marker.getRange().serialize());
    assert.deepEqual(rangesFrom(nextFilePatch.getHunkLayer()), [
      [[0, 0], [2, 4]],
      [[3, 0], [5, 26]],
    ]);
    assert.deepEqual(rangesFrom(nextFilePatch.getUnchangedLayer()), [
      [[0, 0], [0, 4]],
      [[2, 0], [2, 4]],
      [[3, 0], [3, 4]],
    ]);
    assert.deepEqual(rangesFrom(nextFilePatch.getAdditionLayer()), [
      [[1, 0], [1, 4]],
    ]);
    assert.deepEqual(rangesFrom(nextFilePatch.getDeletionLayer()), [
      [[4, 0], [4, 4]],
    ]);
    assert.deepEqual(rangesFrom(nextFilePatch.getNoNewlineLayer()), [
      [[5, 0], [5, 26]],
    ]);
  });

    const nullFilePatch = FilePatch.createNull();

    assert.lengthOf(nullFilePatch.getHunkLayer().getMarkers(), 0);
    assert.lengthOf(nullFilePatch.getUnchangedLayer().getMarkers(), 0);
    assert.lengthOf(nullFilePatch.getAdditionLayer().getMarkers(), 0);
    assert.lengthOf(nullFilePatch.getDeletionLayer().getMarkers(), 0);
    assert.lengthOf(nullFilePatch.getNoNewlineLayer().getMarkers(), 0);