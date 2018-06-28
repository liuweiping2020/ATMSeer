import { } from 'antd';
import * as React from 'react';
import * as methods from "../assets/methods.json";
import { IMethod, IDataRun } from "../types";
import {getColor} from '../helper';
import "./Methods.css"
import ReactEcharts from "echarts-for-react";

export interface IState{
}
export interface IProps{
    height: number,
    datarun: any
}
export default class Methods extends React.Component<IProps, IState>{
    
    public render(){
        // const methodLen = Object.keys(methods).length
        const usedMethods = ['SVM', 'RF', 'DT', 'MLP',,'GP', 'LR', 'KNN'] // the used methods should be obtained by requesting server the config file
        const unusedMethods = Object.keys(methods).filter((name:string)=>usedMethods.indexOf(name)<0)
        return <div className="methods">
        {usedMethods.map((name: string, i:number)=>{
            const method = methods[name]
            return <div key={method.name+'_used'} className="usedMethodContainer"
                    style={{height: `20%`, width: '25%'}}>
                <div className="method">
                    <Method method={method} datarun={this.props.datarun}/>
                </div>
            </div>           
        })}
        
        {unusedMethods.map((name:string)=>(<div key ={name+'_unused'} className='unusedMethod'>{methods[name]['fullname']}</div>))}
        </div>
            
    }
}

class Method extends React.Component<{method:IMethod, datarun:IDataRun}, {}>{
    getOption(){
        const {method, datarun} = this.props
        let parallelAxis=method.root_hyperparameters.map((p:string, idx:number)=>{
            let parameter = method['hyperparameters'][p]
            if (parameter['values']){ //category axis
                return {dim:idx, name:p, type: 'category', data: parameter['values']} 
            }else if(parameter['range']){//value axis
                if(parameter['range'].length>1){ //range in the form of [min, max]
                    return {dim:idx, name:p, type: 'value', min: parameter['range'][0], max: parameter['range'][1]}
                }else{ // range in the form of [max]
                    return {dim:idx, name:p, type: 'value', min: 0, max: parameter['range'][0]}
                }
                
            }
            return {dim:idx, name:p}
        })
        //performance as a value axis
        parallelAxis.push({
            dim:method.root_hyperparameters.length, 
            name:'performance', 
            type:'value', 
            min:0, 
            max:1
        })
        let data:any[] = []
        datarun[1].data.forEach(((_method:string, idx:number)=>{
            if(_method == method.name){
                let par_dict = {}
                let parameters = datarun[2].data[idx] //
                parameters = parameters.split('; ')
                parameters = parameters.map((p:string)=>{
                    let [k, v] = p.split(' = ')
                    return par_dict[k] = v
                })
                let attrs = method.root_hyperparameters.map((p)=>par_dict[p])
                attrs.push(parseFloat(datarun[4].data[idx].split(' +- ') )) // add perforamce
                data.push( attrs  )
            }
        }))
        const option ={
            title:{
                text:method.fullname,
                textStyle:{
                    fontSize: 12,
                }
            },
            parallelAxis,
            parallel: {
                bottom: '10%',
                left: '5%',
                top: '30%',
                // height: '31%',
                // width: '55%',
                parallelAxisDefault: {
                    type: 'value',
                    name: 'performance',
                    nameLocation: 'end',
                    nameGap: 10,
                    splitNumber: 3,
                    nameTextStyle: {
                        fontSize: 14
                    },
                    axisLine: {
                        lineStyle: {
                            color: '#555'
                        }
                    },
                    axisTick: {
                        lineStyle: {
                            color: '#555'
                        }
                    },
                    splitLine: {
                        show: false
                    },
                    axisLabel: {
                        textStyle: {
                            color: '#555'
                        }
                    }
                }
            },
            series: [
                {
                    name: 'parallel',
                    type: 'parallel',
                    smooth: true,
                    inactiveOpacity: 0.2,
                    activeOpacity: 0.9,
                    tooltip:{},
                    lineStyle: {
                        normal: {
                            width: 2,
                            opacity: 0.8,
                            color: getColor(method.name)
                        }
                    },
                    data,
                }
            ],
            
        }
        return option
    }
    render(){
        return <ReactEcharts 
        option = { this.getOption() }
        style={{height: `100%`, width: '100%'}}
        />
    }
}


