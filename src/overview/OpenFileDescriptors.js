import React, { Component } from 'react';
import ClusterTimeseries from '../timeseries/ClusterTimeseries';
import { Button } from 'semantic-ui-react';
import queryLibrary from '../data/query-library';
import uuid from 'uuid';
import _ from 'lodash';

class OpenFileDescriptors extends Component {
    state = {
        key: uuid.v4(),
        width: 400,
        displayProperty: 'fdUsed',
    };

    onUpdate = (childQueryState) => {
        // console.log('child query state',childQueryState);
    };

    // JMX gives us maximum FDs and open FDs, but we want number of used FDs,
    // so we have to augment the data structure because the timeseries doesn't do math
    // for us.
    augmentData = (node) => (data) => {
        const fdUsed = data.fdMax - data.fdOpen;
        return { fdUsed };
    };

    dataFeedMaker = node => {
        const halin = window.halinContext;

        const addr = node.getBoltAddress();
        const driver = halin.driverFor(addr);

        const feed = halin.getDataFeed(_.merge({ node, driver }, queryLibrary.OS_OPEN_FDS));
        feed.addAliases({ 
            fdUsed: ClusterTimeseries.keyFor(addr, 'fdUsed'),
            fdOpen: ClusterTimeseries.keyFor(addr, 'fdOpen'),
            fdMax: ClusterTimeseries.keyFor(addr, 'fdMax'),
        });

        feed.addAugmentationFunction(this.augmentData(node));
        return feed;
    };

    toggleView = (val) => {
        console.log('toggle',val);
        this.setState({ displayProperty: val });
    };

    render() {
        const buttons = [
            { label: 'Used', field: 'fdUsed' },
            { label: 'Available', field: 'fdOpen' },
            { label: 'Max', field: 'fdMax' },
        ];

        return (
            <div className="OpenFileDescriptors">
                <h3>File Descriptors</h3>
                
                <Button.Group size='tiny' style={{paddingBottom: '15px'}}>{
                    buttons.map((b,idx) =>
                        <Button size='tiny'
                            key={idx}
                            active={this.state.displayProperty===b.field}
                            onClick={() => this.toggleView(b.field)}>
                            { b.label }
                        </Button>)
                }</Button.Group>

                <ClusterTimeseries key={this.state.key}
                    width={this.state.width}
                    feedMaker={this.dataFeedMaker}
                    onUpdate={this.onUpdate}
                    displayProperty={this.state.displayProperty}
                />
            </div>
        )
    }
}

export default OpenFileDescriptors;
